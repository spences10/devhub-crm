import { query } from '$app/server';
import { get_current_user_id } from '#lib/server/auth-helpers.ts';
import { db } from '#lib/server/db.ts';
import type { FollowUp, Interaction } from '#lib/types/db.ts';
import { addDays } from 'date-fns';
import * as v from 'valibot';

export const get_dashboard_stats = query(async () => {
	const user_id = await get_current_user_id();
	const now = Date.now();

	// Get contact stats
	const contact_stats = db
		.prepare(
			`
    SELECT COUNT(*) as total_contacts FROM contacts WHERE user_id = ?
  `,
		)
		.get(user_id) as { total_contacts: number };

	// Get interaction stats
	const interaction_stats = db
		.prepare(
			`
    SELECT COUNT(*) as total_interactions FROM interactions i
    INNER JOIN contacts c ON i.contact_id = c.id
    WHERE c.user_id = ?
  `,
		)
		.get(user_id) as { total_interactions: number };

	// Get follow-up stats
	const follow_up_stats = db
		.prepare(
			`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN completed = 0 AND due_date < ? THEN 1 ELSE 0 END) as overdue
    FROM follow_ups f
    INNER JOIN contacts c ON f.contact_id = c.id
    WHERE c.user_id = ?
  `,
		)
		.get(now, user_id) as {
		total: number;
		pending: number;
		overdue: number;
	};

	return {
		contacts: contact_stats.total_contacts,
		interactions: interaction_stats.total_interactions,
		follow_ups: {
			total: follow_up_stats.total,
			pending: follow_up_stats.pending,
			overdue: follow_up_stats.overdue,
		},
	};
});

export const get_dashboard_activity = query(async () => {
	const user_id = await get_current_user_id();

	// Get recent interactions
	const recent_interactions = db
		.prepare(
			`
    SELECT
      i.*,
      c.name as contact_name
    FROM interactions i
    INNER JOIN contacts c ON i.contact_id = c.id
    WHERE c.user_id = ?
    ORDER BY i.created_at DESC
    LIMIT 5
  `,
		)
		.all(user_id) as Array<Interaction & { contact_name: string }>;

	// Get upcoming follow-ups (next 7 days)
	const now = Date.now();
	const future = addDays(now, 7).getTime();
	const upcoming_follow_ups = db
		.prepare(
			`
    SELECT
      f.*,
      c.name as contact_name
    FROM follow_ups f
    INNER JOIN contacts c ON f.contact_id = c.id
    WHERE c.user_id = ?
      AND f.completed = 0
      AND f.due_date BETWEEN ? AND ?
    ORDER BY f.due_date ASC
    LIMIT 5
  `,
		)
		.all(user_id, now, future) as Array<
		FollowUp & { contact_name: string }
	>;

	// Get overdue follow-ups
	const overdue_follow_ups = db
		.prepare(
			`
    SELECT
      f.*,
      c.name as contact_name
    FROM follow_ups f
    INNER JOIN contacts c ON f.contact_id = c.id
    WHERE c.user_id = ?
      AND f.completed = 0
      AND f.due_date < ?
    ORDER BY f.due_date ASC
  `,
		)
		.all(user_id, now) as Array<FollowUp & { contact_name: string }>;

	return {
		recent_interactions,
		upcoming_follow_ups,
		overdue_follow_ups,
	};
});

// Dashboard insights from embeddings
interface InteractionTypeBreakdown {
	type: string;
	label: string;
	count: number;
	percentage: number;
}

interface MostActiveContact {
	contact_id: string;
	contact_name: string;
	interaction_count: number;
	last_interaction_at: number;
}

interface InteractionInsights {
	total_interactions: number;
	interactions_this_month: number;
	interactions_last_month: number;
	unique_contacts_this_month: number;
	type_breakdown: InteractionTypeBreakdown[];
	most_active_contacts: MostActiveContact[];
}

interface ReconnectSuggestion {
	contact_id: string;
	contact_name: string;
	days_since_contact: number;
	reason: string;
	similarity_score: number;
}

export const get_dashboard_insights = query(async () => {
	const user_id = await get_current_user_id();

	const empty_insights: InteractionInsights = {
		total_interactions: 0,
		interactions_this_month: 0,
		interactions_last_month: 0,
		unique_contacts_this_month: 0,
		type_breakdown: [],
		most_active_contacts: [],
	};

	try {
		const result = db
			.prepare(
				`
				SELECT network_topics, reconnect_suggestions, last_updated
				FROM dashboard_insights
				WHERE user_id = ?
			`,
			)
			.get(user_id) as
			| {
					network_topics: string;
					reconnect_suggestions: string;
					last_updated: number;
			  }
			| undefined;

		if (!result) {
			return {
				interaction_insights: empty_insights,
				reconnect_suggestions: [] as ReconnectSuggestion[],
				last_updated: null,
			};
		}

		return {
			interaction_insights: JSON.parse(
				result.network_topics,
			) as InteractionInsights,
			reconnect_suggestions: JSON.parse(
				result.reconnect_suggestions,
			) as ReconnectSuggestion[],
			last_updated: result.last_updated,
		};
	} catch (error) {
		console.error('Error getting dashboard insights:', error);
		return {
			interaction_insights: empty_insights,
			reconnect_suggestions: [] as ReconnectSuggestion[],
			last_updated: null,
		};
	}
});

// Get context for a follow-up (recent interactions with the contact)
export const get_follow_up_context = query.batch(
	v.string(),
	async (contact_ids) => {
		const context_map = new Map<
			string,
			Array<{ note: string; type: string; created_at: number }>
		>();

		// Get recent interactions for each contact (last 5)
		for (const contact_id of contact_ids) {
			const interactions = db
				.prepare(
					`
				SELECT note, type, created_at
				FROM interactions
				WHERE contact_id = ?
				AND note IS NOT NULL
				AND note != ''
				ORDER BY created_at DESC
				LIMIT 5
			`,
				)
				.all(contact_id) as Array<{
				note: string;
				type: string;
				created_at: number;
			}>;

			context_map.set(contact_id, interactions);
		}

		return (contact_id: string) => {
			return context_map.get(contact_id) || [];
		};
	},
);
