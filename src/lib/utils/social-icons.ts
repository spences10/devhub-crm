import {
	Bluesky,
	GitHub,
	Globe,
	Link,
	LinkedIn,
	Mastodon,
	Twitter,
	YouTube,
} from '#lib/icons/index.ts';
import type { Component } from 'svelte';

type IconComponent = Component<any>;

const platform_icons: Record<string, IconComponent> = {
	github: GitHub,
	twitter: Twitter,
	linkedin: LinkedIn,
	youtube: YouTube,
	bluesky: Bluesky,
	mastodon: Mastodon,
	website: Globe,
};

const platform_labels: Record<string, string> = {
	github: 'GitHub',
	twitter: 'Twitter',
	linkedin: 'LinkedIn',
	youtube: 'YouTube',
	bluesky: 'Bluesky',
	mastodon: 'Mastodon',
	website: 'Website',
};

/**
 * Get the icon component for a social platform
 * @param platform - The platform name (case-insensitive)
 * @returns The icon component for the platform, or a generic Link icon if not found
 */
export function get_platform_icon(platform: string): IconComponent {
	const normalized = platform.toLowerCase();
	return platform_icons[normalized] || Link;
}

/**
 * Get the display label for a social platform
 * @param platform - The platform name (case-insensitive)
 * @returns The formatted display label for the platform
 */
export function get_platform_label(platform: string): string {
	const normalized = platform.toLowerCase();
	return (
		platform_labels[normalized] ||
		platform.charAt(0).toUpperCase() + platform.slice(1)
	);
}
