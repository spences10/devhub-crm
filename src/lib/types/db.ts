// Database type definitions for Devhub CRM
import type { InteractionType } from '#lib/constants/interaction.ts';

export interface Contact {
	id: string;
	user_id: string;
	name: string;
	email: string | null;
	phone: string | null;
	company: string | null;
	title: string | null;
	github_username: string | null;
	avatar_url: string | null; // GitHub avatar or user-uploaded image
	is_vip: number; // 0 or 1 (SQLite boolean)
	birthday: string | null; // YYYY-MM-DD format
	notes: string | null;
	in_network_since: number | null; // Timestamp when contact joined network
	last_contacted_at: number | null;
	created_at: number;
	updated_at: number;
	tags?: Tag[]; // Optional: tags associated with this contact
}

export interface Interaction {
	id: string;
	contact_id: string;
	type: InteractionType;
	note: string | null;
	created_at: number;
	updated_at: number;
}

export interface FollowUp {
	id: string;
	contact_id: string;
	due_date: number;
	note: string | null;
	completed: number; // 0 or 1 (SQLite boolean)
	completed_at: number | null;
	created_at: number;
	updated_at: number;
}

export interface SocialLink {
	id: string;
	contact_id: string;
	platform: string; // 'twitter', 'bluesky', 'linkedin', 'website', etc.
	url: string;
	created_at: number;
}

export interface UserPreferences {
	id: string;
	user_id: string;
	date_format: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
	time_format: '12h' | '24h';
	default_contact_sort:
		| 'name'
		| 'last_contacted'
		| 'recently_added'
		| 'company';
	default_follow_up_days: number;
	default_interaction_type: InteractionType | null;
	created_at: number;
	updated_at: number;
}

export interface UserProfile {
	id: string;
	user_id: string;
	username: string;
	github_username: string | null;
	bio: string | null;
	tagline: string | null;
	location: string | null;
	website: string | null;
	visibility: 'public' | 'unlisted' | 'private';
	custom_slug: string | null; // Pro feature
	qr_code_url: string | null; // Data URL for QR code SVG
	qr_settings: string | null; // JSON string for QR customization
	github_synced_at: number | null;
	created_at: number;
	updated_at: number;
}

export interface UserSocialLink {
	id: string;
	user_id: string;
	platform: string; // 'github', 'twitter', 'linkedin', 'bluesky', 'mastodon', etc.
	url: string;
	created_at: number;
}

export interface ProfileView {
	id: string;
	user_id: string;
	viewer_id: string | null; // NULL if not logged in
	qr_scan: number; // 0 or 1 (SQLite boolean)
	referrer: string | null;
	created_at: number;
}

export interface Tag {
	id: string;
	user_id: string;
	name: string;
	color: string; // Hex color code
	created_at: number;
	updated_at: number;
}

export interface ContactTag {
	id: string;
	contact_id: string;
	tag_id: string;
	created_at: number;
}
