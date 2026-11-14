import {
	Arrow,
	Balloon,
	Bluesky,
	Calendar,
	Call,
	Cancel,
	CheckCircleFill,
	Check,
	CircleBack,
	ContactBook,
	Contacts,
	Cross,
	Dashboard,
	DiscoBall,
	Edit,
	Email,
	GitHub,
	Globe,
	InformationCircle,
	Lightbulb,
	Link,
	LinkedIn,
	LocationPin,
	Mastodon,
	Message,
	Monitor,
	Phone,
	QrCode,
	Refresh,
	Rocket,
	Settings,
	Sparkles,
	StarFill,
	Tag,
	TakeawayCoffee,
	Target,
	ThumbsUp,
	Trash,
	Twitter,
	User,
	Warning,
	YouTube,
} from '#lib/icons/index.ts';

// Map of icon names to icon components
const ICON_MAP: Record<string, any> = {
	Arrow,
	Balloon,
	Bluesky,
	Calendar,
	Call,
	Cancel,
	CheckCircleFill,
	Check,
	CircleBack,
	ContactBook,
	Contacts,
	Cross,
	Dashboard,
	DiscoBall,
	Edit,
	Email,
	GitHub,
	Globe,
	InformationCircle,
	Lightbulb,
	Link,
	LinkedIn,
	LocationPin,
	Mastodon,
	Message,
	Monitor,
	Phone,
	QrCode,
	Refresh,
	Rocket,
	Settings,
	Sparkles,
	StarFill,
	Tag,
	TakeawayCoffee,
	Target,
	ThumbsUp,
	Trash,
	Twitter,
	User,
	Warning,
	YouTube,
};

/**
 * Get icon component by name
 * Returns the icon component or a default (Calendar) if not found
 */
export function get_icon_component(icon_name: string) {
	return ICON_MAP[icon_name] || Calendar;
}

/**
 * Get all available icon names for the icon selector
 */
export function get_available_icons(): string[] {
	return Object.keys(ICON_MAP).sort();
}

/**
 * Available DaisyUI theme colors
 */
export const AVAILABLE_THEME_COLORS = [
	{ name: 'Primary', value: 'bg-primary text-primary-content' },
	{ name: 'Secondary', value: 'bg-secondary text-secondary-content' },
	{ name: 'Accent', value: 'bg-accent text-accent-content' },
	{ name: 'Info', value: 'bg-info text-info-content' },
	{ name: 'Success', value: 'bg-success text-success-content' },
	{ name: 'Warning', value: 'bg-warning text-warning-content' },
	{ name: 'Error', value: 'bg-error text-error-content' },
	{ name: 'Neutral', value: 'bg-neutral text-neutral-content' },
] as const;

/**
 * Get color name by value (for display in UI)
 */
export function get_color_name(color_value: string): string {
	const color = AVAILABLE_THEME_COLORS.find(
		(c) => c.value === color_value,
	);
	return color?.name || 'Unknown';
}
