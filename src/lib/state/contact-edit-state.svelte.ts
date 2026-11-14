// Re-export interaction constants for use in components
import type { InteractionType } from '#lib/constants/interaction.ts';
export {
	INTERACTION_TYPE_COLORS,
	INTERACTION_TYPE_ICONS,
	INTERACTION_TYPES,
	type InteractionType,
} from '#lib/constants/interaction.ts';

import type { FollowUp, Interaction } from '#lib/types/db.ts';
import {
	complete_follow_up,
	delete_follow_up,
	get_all_follow_ups,
	get_contact_follow_ups,
	update_follow_up,
} from '../../routes/(app)/follow-ups/follow-ups.remote';
import {
	delete_interaction,
	get_interactions,
	update_interaction,
} from '../../routes/(app)/interactions/interactions.remote';

export let edit_state = $state({
	show_delete_confirmation: false,

	// Follow-up editing
	edit_follow_up_id: null as string | null,
	delete_follow_up_id: null as string | null,
	edit_follow_up_due_date_str: '',
	edit_follow_up_note: '',

	// Interaction editing
	edit_interaction_id: null as string | null,
	delete_interaction_id: null as string | null,
	edit_interaction_type: 'meeting' as InteractionType,
	edit_interaction_note: '',
});

// Follow-up handlers
export function handle_edit_follow_up_click(
	event: MouseEvent,
	follow_up: FollowUp,
) {
	event.stopPropagation();
	edit_state.edit_follow_up_id = follow_up.id;
	const date = new Date(follow_up.due_date);
	edit_state.edit_follow_up_due_date_str = date
		.toISOString()
		.slice(0, 16);
	edit_state.edit_follow_up_note = follow_up.note || '';
}

export async function save_edit_follow_up(contact_id: string) {
	if (!edit_state.edit_follow_up_id) return;
	try {
		const due_date = new Date(
			edit_state.edit_follow_up_due_date_str,
		).getTime();
		await update_follow_up({
			id: edit_state.edit_follow_up_id,
			due_date,
			note: edit_state.edit_follow_up_note,
		}).updates(
			get_contact_follow_ups(contact_id),
			get_all_follow_ups(''),
		);
		edit_state.edit_follow_up_id = null;
	} catch (error) {
		console.error('Failed to update follow-up:', error);
		throw error;
	}
}

export function cancel_edit_follow_up() {
	edit_state.edit_follow_up_id = null;
}

export async function handle_complete_follow_up(
	id: string,
	contact_id: string,
) {
	try {
		await complete_follow_up(id).updates(
			get_contact_follow_ups(contact_id),
			get_all_follow_ups(''),
		);
	} catch (error) {
		console.error('Failed to complete follow-up:', error);
		throw error;
	}
}

export function handle_delete_follow_up_click(
	event: MouseEvent,
	id: string,
) {
	event.stopPropagation();
	edit_state.delete_follow_up_id = id;
}

export async function confirm_delete_follow_up(contact_id: string) {
	if (!edit_state.delete_follow_up_id) return;
	try {
		await delete_follow_up(edit_state.delete_follow_up_id).updates(
			get_contact_follow_ups(contact_id),
			get_all_follow_ups(''),
		);
		edit_state.delete_follow_up_id = null;
	} catch (error) {
		console.error('Failed to delete follow-up:', error);
		throw error;
	}
}

export function cancel_delete_follow_up() {
	edit_state.delete_follow_up_id = null;
}

// Interaction handlers
export function handle_edit_interaction_click(
	event: MouseEvent,
	interaction: Interaction,
) {
	event.stopPropagation();
	edit_state.edit_interaction_id = interaction.id;
	edit_state.edit_interaction_type = interaction.type;
	edit_state.edit_interaction_note = interaction.note || '';
}

export async function save_edit_interaction(contact_id: string) {
	if (!edit_state.edit_interaction_id) return;
	try {
		await update_interaction({
			id: edit_state.edit_interaction_id,
			type: edit_state.edit_interaction_type as InteractionType,
			note: edit_state.edit_interaction_note,
		}).updates(get_interactions(contact_id));
		edit_state.edit_interaction_id = null;
	} catch (error) {
		console.error('Failed to update interaction:', error);
		throw error;
	}
}

export function cancel_edit_interaction() {
	edit_state.edit_interaction_id = null;
}

export function handle_delete_interaction_click(
	event: MouseEvent,
	id: string,
) {
	event.stopPropagation();
	edit_state.delete_interaction_id = id;
}

export async function confirm_delete_interaction(contact_id: string) {
	if (!edit_state.delete_interaction_id) return;
	try {
		await delete_interaction(
			edit_state.delete_interaction_id,
		).updates(get_interactions(contact_id));
		edit_state.delete_interaction_id = null;
	} catch (error) {
		console.error('Failed to delete interaction:', error);
		throw error;
	}
}

export function cancel_delete_interaction() {
	edit_state.delete_interaction_id = null;
}
