import { db } from '#lib/server/db.ts';

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

/**
 * Compute interaction insights based on actual usage patterns
 * Provides actionable CRM metrics instead of vague topics
 */
const compute_interaction_insights = async (
	user_id: string,
): Promise<InteractionInsights> => {
	try {
		const now = Date.now();
		const thirty_days_ago = now - 30 * 24 * 60 * 60 * 1000;

		// Get start of this month
		const now_date = new Date(now);
		const this_month_start = new Date(
			now_date.getFullYear(),
			now_date.getMonth(),
			1,
		).getTime();

		// Get start of last month
		const last_month_date = new Date(
			now_date.getFullYear(),
			now_date.getMonth() - 1,
			1,
		);
		const last_month_start = last_month_date.getTime();
		const last_month_end = this_month_start;

		// Total interactions
		const total_result = db
			.prepare(
				`
				SELECT COUNT(*) as count
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				WHERE c.user_id = ?
			`,
			)
			.get(user_id) as { count: number };

		// This month's interactions
		const this_month_result = db
			.prepare(
				`
				SELECT COUNT(*) as count
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				WHERE c.user_id = ?
				AND i.created_at >= ?
			`,
			)
			.get(user_id, this_month_start) as { count: number };

		// Last month's interactions
		const last_month_result = db
			.prepare(
				`
				SELECT COUNT(*) as count
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				WHERE c.user_id = ?
				AND i.created_at >= ?
				AND i.created_at < ?
			`,
			)
			.get(user_id, last_month_start, last_month_end) as {
			count: number;
		};

		// Unique contacts this month
		const unique_contacts_result = db
			.prepare(
				`
				SELECT COUNT(DISTINCT i.contact_id) as count
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				WHERE c.user_id = ?
				AND i.created_at >= ?
			`,
			)
			.get(user_id, this_month_start) as { count: number };

		// Interaction type breakdown (last 30 days)
		const type_breakdown_raw = db
			.prepare(
				`
				SELECT i.type, it.label, COUNT(*) as count
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				LEFT JOIN interaction_types it ON i.type = it.value AND (it.user_id = ? OR it.user_id IS NULL)
				WHERE c.user_id = ?
				AND i.created_at >= ?
				GROUP BY i.type, it.label
				ORDER BY count DESC
			`,
			)
			.all(user_id, user_id, thirty_days_ago) as Array<{
			type: string;
			label: string | null;
			count: number;
		}>;

		const total_recent = type_breakdown_raw.reduce(
			(sum, t) => sum + t.count,
			0,
		);
		const type_breakdown: InteractionTypeBreakdown[] =
			type_breakdown_raw.map((t) => ({
				type: t.type,
				label: t.label || t.type,
				count: t.count,
				percentage:
					total_recent > 0
						? Math.round((t.count / total_recent) * 100)
						: 0,
			}));

		// Most active contacts (last 30 days)
		const most_active_contacts = db
			.prepare(
				`
				SELECT
					c.id as contact_id,
					c.name as contact_name,
					COUNT(*) as interaction_count,
					MAX(i.created_at) as last_interaction_at
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				WHERE c.user_id = ?
				AND i.created_at >= ?
				GROUP BY c.id, c.name
				ORDER BY interaction_count DESC, last_interaction_at DESC
				LIMIT 5
			`,
			)
			.all(user_id, thirty_days_ago) as MostActiveContact[];

		console.log(
			`Computed insights for user ${user_id}: ${total_result.count} total, ${this_month_result.count} this month`,
		);

		return {
			total_interactions: total_result.count,
			interactions_this_month: this_month_result.count,
			interactions_last_month: last_month_result.count,
			unique_contacts_this_month: unique_contacts_result.count,
			type_breakdown,
			most_active_contacts,
		};
	} catch (error) {
		console.error('Error computing interaction insights:', error);
		return {
			total_interactions: 0,
			interactions_this_month: 0,
			interactions_last_month: 0,
			unique_contacts_this_month: 0,
			type_breakdown: [],
			most_active_contacts: [],
		};
	}
};

/**
 * Compute reconnect suggestions
 * Find contacts similar to recent activity who haven't been contacted recently
 */
const compute_reconnect_suggestions = async (
	user_id: string,
): Promise<ReconnectSuggestion[]> => {
	try {
		const now = Date.now();
		const thirty_days_ago = now - 30 * 24 * 60 * 60 * 1000;

		// Get recent interactions (last 30 days)
		const recent_interactions = db
			.prepare(
				`
				SELECT i.id, i.contact_id
				FROM interactions i
				INNER JOIN contacts c ON i.contact_id = c.id
				WHERE c.user_id = ?
				AND i.created_at >= ?
			`,
			)
			.all(user_id, thirty_days_ago) as Array<{
			id: string;
			contact_id: string;
		}>;

		// Get contacts not contacted in 30+ days with embeddings (for AI-powered suggestions)
		// Only include contacts we've actually contacted before (NOT NULL)
		const stale_contacts = db
			.prepare(
				`
				SELECT c.id, c.name, c.last_contacted_at
				FROM contacts c
				LEFT JOIN contact_embeddings ce ON c.id = ce.contact_id
				WHERE c.user_id = ?
				AND c.last_contacted_at IS NOT NULL
				AND c.last_contacted_at < ?
			`,
			)
			.all(user_id, thirty_days_ago) as Array<{
			id: string;
			name: string;
			last_contacted_at: number | null;
		}>;

		console.log(
			`Finding reconnect suggestions from ${stale_contacts.length} stale contacts`,
		);

		// Try AI-powered suggestions using embeddings (optional)
		let similar_interactions: Array<{
			interaction_id: string;
			contact_id: string;
			distance: number;
		}> = [];

		if (recent_interactions.length > 0) {
			try {
				// Find similar contacts based on recent activity
				const reference_interaction_id = recent_interactions[0].id;

				similar_interactions = db
					.prepare(
						`
						SELECT ie.interaction_id, i.contact_id, ie.distance
						FROM interaction_embeddings ie
						INNER JOIN interactions i ON ie.interaction_id = i.id
						INNER JOIN contacts c ON i.contact_id = c.id
						WHERE ie.embedding MATCH (
							SELECT embedding FROM interaction_embeddings WHERE interaction_id = ?
						)
						AND k = 20
						AND c.user_id = ?
					`,
					)
					.all(reference_interaction_id, user_id) as Array<{
					interaction_id: string;
					contact_id: string;
					distance: number;
				}>;

				console.log(
					`Found ${similar_interactions.length} AI-powered suggestions`,
				);
			} catch {
				console.log(
					'Embeddings not available, using simpler suggestions',
				);
			}
		}

		// Match with stale contacts
		const suggestions: ReconnectSuggestion[] = [];
		const stale_contact_ids = new Set(
			stale_contacts.map((c) => c.id),
		);

		for (const similar of similar_interactions) {
			if (stale_contact_ids.has(similar.contact_id)) {
				const contact = stale_contacts.find(
					(c) => c.id === similar.contact_id,
				);
				if (!contact) continue;

				const days_since = contact.last_contacted_at
					? Math.floor(
							(now - contact.last_contacted_at) /
								(1000 * 60 * 60 * 24),
						)
					: 999;

				suggestions.push({
					contact_id: contact.id,
					contact_name: contact.name,
					days_since_contact: days_since,
					reason: 'Similar to recent conversations',
					similarity_score: 1 - similar.distance, // Convert distance to similarity
				});
			}

			if (suggestions.length >= 5) break;
		}

		// If we don't have enough suggestions, add some based on time alone
		if (suggestions.length < 5) {
			const remaining_contacts = stale_contacts
				.filter(
					(c) => !suggestions.some((s) => s.contact_id === c.id),
				)
				.sort((a, b) => {
					const a_time = a.last_contacted_at || 0;
					const b_time = b.last_contacted_at || 0;
					return a_time - b_time; // Oldest first
				})
				.slice(0, 5 - suggestions.length);

			for (const contact of remaining_contacts) {
				const days_since = contact.last_contacted_at
					? Math.floor(
							(now - contact.last_contacted_at) /
								(1000 * 60 * 60 * 24),
						)
					: 999;

				suggestions.push({
					contact_id: contact.id,
					contact_name: contact.name,
					days_since_contact: days_since,
					reason: "Haven't connected in a while",
					similarity_score: 0.5,
				});
			}
		}

		// If still not enough, add never-contacted contacts
		if (suggestions.length < 5) {
			const never_contacted = db
				.prepare(
					`
					SELECT c.id, c.name, c.created_at
					FROM contacts c
					WHERE c.user_id = ?
					AND c.last_contacted_at IS NULL
					ORDER BY c.created_at DESC
					LIMIT ?
				`,
				)
				.all(user_id, 5 - suggestions.length) as Array<{
				id: string;
				name: string;
				created_at: number;
			}>;

			for (const contact of never_contacted) {
				const days_since_added = Math.floor(
					(now - contact.created_at) / (1000 * 60 * 60 * 24),
				);

				suggestions.push({
					contact_id: contact.id,
					contact_name: contact.name,
					days_since_contact: days_since_added,
					reason: 'Start building this relationship',
					similarity_score: 0.3,
				});
			}
		}

		return suggestions.slice(0, 5);
	} catch (error) {
		console.error('Error computing reconnect suggestions:', error);
		return [];
	}
};

/**
 * Compute and store dashboard insights for a user
 * This is cached in dashboard_insights table and refreshed periodically
 */
export const compute_insights = async (user_id?: string) => {
	try {
		let user_ids: string[];

		if (user_id) {
			user_ids = [user_id];
		} else {
			// Compute for all users who have contacts
			const users = db
				.prepare('SELECT DISTINCT user_id FROM contacts')
				.all() as Array<{
				user_id: string;
			}>;
			user_ids = users.map((u) => u.user_id);
		}

		console.log(`Computing insights for ${user_ids.length} user(s)`);

		const results = [];

		for (const uid of user_ids) {
			try {
				console.log(`Computing insights for user ${uid}`);

				// Compute interaction insights
				const interaction_insights =
					await compute_interaction_insights(uid);

				// Compute reconnect suggestions
				const reconnect_suggestions =
					await compute_reconnect_suggestions(uid);

				// Store in database
				const now = Date.now();
				const stmt = db.prepare(`
					INSERT INTO dashboard_insights (user_id, network_topics, reconnect_suggestions, last_updated, created_at)
					VALUES (?, ?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
						network_topics = excluded.network_topics,
						reconnect_suggestions = excluded.reconnect_suggestions,
						last_updated = excluded.last_updated
				`);

				stmt.run(
					uid,
					JSON.stringify(interaction_insights),
					JSON.stringify(reconnect_suggestions),
					now,
					now,
				);

				results.push({
					user_id: uid,
					interaction_insights,
					reconnect_suggestions_count: reconnect_suggestions.length,
				});

				console.log(
					`Computed insights for user ${uid}: ${interaction_insights.total_interactions} total interactions, ${reconnect_suggestions.length} suggestions`,
				);
			} catch (error) {
				console.error(
					`Error computing insights for user ${uid}:`,
					error,
				);
			}
		}

		return {
			message: 'Dashboard insights computed successfully',
			users_processed: user_ids.length,
			results,
		};
	} catch (error) {
		console.error('Error in compute_insights:', error);
		throw error;
	}
};
