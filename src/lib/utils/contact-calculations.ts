import {
	Calendar,
	CheckCircleFill,
	Email,
	Lightbulb,
	Message,
	Target,
	User,
	Warning,
} from '#lib/icons/index.ts';
import type { Contact, UserPreferences } from '#lib/types/db.ts';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import type { Component } from 'svelte';
import { format_date } from './date-helpers';

// Extended contact type with computed fields
export interface ContactWithStats extends Contact {
	interaction_count: number;
	last_interaction_at: number | null;
	pending_follow_ups: number;
}

export type HealthStatus = {
	label: string;
	color: string;
	icon: Component;
};

export function get_initials(name: string): string {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

export function calculate_health_score(
	contact: ContactWithStats,
): number {
	let score = 50; // Base score

	// Interactions boost
	if (contact.interaction_count > 0) {
		score += Math.min(contact.interaction_count * 5, 30);
	}

	// Recent contact boost
	if (contact.last_interaction_at) {
		const days_since = differenceInDays(
			Date.now(),
			contact.last_interaction_at,
		);
		if (days_since < 7) score += 20;
		else if (days_since < 30) score += 10;
		else if (days_since > 90) score -= 20;
	} else {
		score -= 20; // Never contacted
	}

	// VIP boost
	if (contact.is_vip) score += 10;

	// Pending follow-ups penalty
	if (contact.pending_follow_ups > 2) score -= 10;

	return Math.max(0, Math.min(100, score));
}

export function get_health_status(score: number): HealthStatus {
	if (score >= 80)
		return {
			label: 'Excellent',
			color: 'text-success',
			icon: CheckCircleFill,
		};
	if (score >= 60)
		return { label: 'Good', color: 'text-info', icon: Target };
	if (score >= 40)
		return {
			label: 'Fair',
			color: 'text-warning',
			icon: Lightbulb,
		};
	return {
		label: 'Needs Attention',
		color: 'text-error',
		icon: Warning,
	};
}

export function days_since_contact(timestamp: number | null): string {
	if (!timestamp) return 'Never';
	return formatDistanceToNow(timestamp, { addSuffix: true });
}

/**
 * Format network duration without the "ago" suffix
 * Used for "In Your Network" display
 */
export function format_network_duration(timestamp: number): string {
	return formatDistanceToNow(timestamp);
}

export function get_stats_cards(
	contact: ContactWithStats,
	health_score: number,
	health_status: HealthStatus,
	overdue_count: number,
	preferences: UserPreferences,
) {
	return [
		{
			icon: health_status.icon,
			icon_color: health_status.color,
			value: health_score,
			value_color: health_status.color,
			label: 'Relationship Health',
			sublabel: health_status.label,
			sublabel_color: health_status.color,
		},
		{
			icon: Message,
			icon_color: 'text-info',
			value: contact.interaction_count,
			value_color: 'text-info',
			label: 'Total Interactions',
			sublabel: days_since_contact(contact.last_interaction_at),
			sublabel_color: 'opacity-60',
		},
		{
			icon: Calendar,
			icon_color: overdue_count > 0 ? 'text-error' : 'text-warning',
			value: contact.pending_follow_ups,
			value_color: overdue_count > 0 ? 'text-error' : 'text-warning',
			label: 'Pending Follow-ups',
			sublabel: overdue_count > 0 ? `${overdue_count} overdue` : null,
			sublabel_color: 'text-error',
		},
		{
			icon: User,
			icon_color: 'text-success',
			value: format_network_duration(
				contact.in_network_since || contact.created_at,
			),
			value_color: 'text-success',
			label: 'In Your Network',
			sublabel: `Since ${format_date(new Date(contact.in_network_since || contact.created_at), preferences.date_format)}`,
			sublabel_color: 'opacity-60',
		},
	];
}

export function get_action_cards(
	contact_id: string,
	email: string | null,
) {
	return [
		{
			href: `/interactions/new?contact_id=${contact_id}`,
			icon: Message,
			icon_color: 'text-primary',
			title: 'Log Interaction',
			title_short: 'Interaction',
			description: 'Record a meeting, call, email, or message',
			enabled: true,
		},
		{
			href: `/follow-ups/new?contact_id=${contact_id}`,
			icon: Calendar,
			icon_color: 'text-warning',
			title: 'Schedule Follow-up',
			title_short: 'Follow-up',
			description: 'Set a reminder to reconnect',
			enabled: true,
		},
		{
			href: email ? `mailto:${email}` : null,
			icon: Email,
			icon_color: email ? 'text-info' : 'text-base-content/30',
			title: 'Send Email',
			title_short: 'Email',
			description: email
				? 'Open your email client'
				: 'No email address on file',
			enabled: !!email,
		},
	];
}
