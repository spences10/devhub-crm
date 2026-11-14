import {
	Calendar,
	Contacts,
	Dashboard,
	Message,
	Settings,
	Tag,
	User,
} from '#lib/icons/index.ts';
import type { Component } from 'svelte';

export interface NavItem {
	href: string;
	label: string;
	icon: Component;
}

export const nav_items: NavItem[] = [
	{ href: '/dashboard', label: 'Dashboard', icon: Dashboard },
	{ href: '/contacts', label: 'Contacts', icon: Contacts },
	{ href: '/tags', label: 'Tags', icon: Tag },
	{ href: '/interactions', label: 'Interactions', icon: Message },
	{ href: '/follow-ups', label: 'Follow-ups', icon: Calendar },
	{ href: '/profile', label: 'Profile', icon: User },
	{ href: '/settings', label: 'Settings', icon: Settings },
];

// Filtered sets for different contexts
export const dock_nav_items = nav_items.filter((item) =>
	[
		'/dashboard',
		'/contacts',
		'/follow-ups',
		'/interactions',
		'/profile',
	].includes(item.href),
);

export const page_nav_items = nav_items.filter((item) =>
	[
		'/dashboard',
		'/contacts',
		'/interactions',
		'/follow-ups',
		'/profile',
		'/settings',
	].includes(item.href),
);
