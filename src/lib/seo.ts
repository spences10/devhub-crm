import type { SeoConfig } from 'svead';
import { site_info } from './site-info';

interface CreateSeoConfigOptions {
	title?: string;
	description?: string;
	slug?: string;
	image?: string;
	type?: 'website' | 'article';
	author_name?: string;
	published_time?: string;
	modified_time?: string;
}

export function create_seo_config(
	options: CreateSeoConfigOptions = {},
): SeoConfig {
	const {
		title = site_info.name,
		description = site_info.description,
		slug = '',
		image = `${site_info.url}/og-image.png`, // You'll want to create this
		author_name,
	} = options;

	const url = slug ? `${site_info.url}/${slug}` : site_info.url;
	const full_title =
		title === site_info.name ? title : `${title} • ${site_info.name}`;

	const config: SeoConfig = {
		title: full_title,
		description,
		url,
		website: site_info.url,
		open_graph_image: image,
		author_name: author_name || site_info.author.name,
		site_name: site_info.name,
		payment_pointer: undefined,
		twitter_handle: site_info.social.twitter,
		twitter_card_type: 'summary_large_image',
		language: 'en',
	};

	return config;
}

// Specific page SEO configs
export const seo_configs = {
	home: create_seo_config({
		title: 'Devhub - Developer Relationship Management',
		description:
			'Manage your developer relationships with ease. Track contacts, interactions, and follow-ups with powerful GitHub integration.',
	}),
	login: create_seo_config({
		title: 'Sign In',
		description:
			'Sign in to your Devhub account to manage your developer relationships.',
		slug: 'login',
	}),
	register: create_seo_config({
		title: 'Create Account',
		description:
			'Create a free Devhub account and start managing your developer relationships today.',
		slug: 'register',
	}),
	dashboard: create_seo_config({
		title: 'Dashboard',
		description: 'View your recent activity and upcoming follow-ups.',
		slug: 'dashboard',
	}),
	contacts: create_seo_config({
		title: 'Contacts',
		description: 'Manage your developer contacts and relationships.',
		slug: 'contacts',
	}),
	interactions: create_seo_config({
		title: 'Interactions',
		description:
			'Track all your interactions with developer contacts.',
		slug: 'interactions',
	}),
	followUps: create_seo_config({
		title: 'Follow-ups',
		description:
			'Manage your scheduled follow-ups and stay on top of relationships.',
		slug: 'follow-ups',
	}),
	settings: create_seo_config({
		title: 'Settings',
		description: 'Manage your account settings and preferences.',
		slug: 'settings',
	}),
	forgotPassword: create_seo_config({
		title: 'Reset Password',
		description: 'Reset your Devhub account password.',
		slug: 'forgot-password',
	}),
	resetPassword: create_seo_config({
		title: 'Create New Password',
		description: 'Create a new password for your Devhub account.',
		slug: 'reset-password',
	}),
};
