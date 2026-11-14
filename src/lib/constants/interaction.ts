import {
	Calendar,
	Call,
	Email,
	Message,
	TakeawayCoffee,
} from '#lib/icons/index.ts';

export type InteractionType =
	| 'meeting'
	| 'call'
	| 'email'
	| 'message'
	| 'coffee';

export const INTERACTION_TYPES = [
	{ value: 'meeting' as const, label: 'Meeting' },
	{ value: 'call' as const, label: 'Call' },
	{ value: 'email' as const, label: 'Email' },
	{ value: 'message' as const, label: 'Message' },
	{ value: 'coffee' as const, label: 'Coffee' },
] as const;

export const INTERACTION_TYPE_ICONS: Record<InteractionType, any> = {
	meeting: Calendar,
	call: Call,
	email: Email,
	message: Message,
	coffee: TakeawayCoffee,
};

export const INTERACTION_TYPE_COLORS: Record<
	InteractionType,
	string
> = {
	meeting: 'bg-primary text-primary-content',
	call: 'bg-secondary text-secondary-content',
	email: 'bg-accent text-accent-content',
	message: 'bg-info text-info-content',
	coffee: 'bg-warning text-warning-content',
};
