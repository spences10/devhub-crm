<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Field, Input } from '#lib/components/ui/index.ts';
	import { Trash } from '#lib/icons/index.ts';
	import type { delete_account } from './profile.remote';

	interface Props {
		on_delete: typeof delete_account;
	}

	let { on_delete }: Props = $props();

	let modal_open = $state(false);
	let confirmation = $state('');
	let error_message = $state('');
	let deleting = $state(false);

	function open_modal() {
		modal_open = true;
		confirmation = '';
		error_message = '';
	}

	function close_modal() {
		modal_open = false;
		confirmation = '';
		error_message = '';
	}

	async function handle_delete() {
		error_message = '';

		if (confirmation !== 'DELETE') {
			error_message = 'You must type DELETE to confirm';
			return;
		}

		deleting = true;

		try {
			await on_delete(confirmation);
			// Navigate to home - user is deleted and signed out
			// The home page will re-fetch and see no user
			await goto('/', { refreshAll: true });
		} catch (err) {
			console.error('Failed to delete account:', err);
			error_message =
				err instanceof Error
					? err.message
					: 'Failed to delete account. Please try again.';
			deleting = false;
		}
	}
</script>

<div class="card border-2 border-error bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="flex items-start gap-3">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-base-200"
			>
				<Trash size="24px" class_names="text-error" />
			</div>
			<div class="flex-1">
				<h2 class="card-title text-error">Danger Zone</h2>
				<p class="text-sm opacity-70">
					Once you delete your account, there is no going back. Please
					be certain.
				</p>
			</div>
		</div>

		<div class="divider"></div>

		<div class="space-y-2">
			<h3 class="font-semibold">Deleting your account will:</h3>
			<ul class="ml-6 list-disc space-y-1 text-sm opacity-80">
				<li>Permanently delete all your contacts and their data</li>
				<li>Remove all interactions and follow-ups</li>
				<li>Delete your public profile and social links</li>
				<li>Remove all tags and preferences</li>
				<li>Clear your GitHub integration</li>
				<li>This action cannot be undone</li>
			</ul>
		</div>

		<div class="mt-4 card-actions justify-end">
			<Button variant="error" onclick={open_modal}>
				Delete My Account
			</Button>
		</div>
	</div>
</div>

<!-- Modal -->
{#if modal_open}
	<dialog class="modal modal-open">
		<div class="modal-box w-11/12 max-w-md">
			<h3 class="text-lg font-bold text-error">Delete Account</h3>
			<p class="py-4">
				This action is <strong>permanent</strong> and
				<strong>irreversible</strong>. All your data will be deleted
				immediately.
			</p>

			<div class="space-y-4">
				<Field legend="Type DELETE to confirm">
					<Input
						type="text"
						placeholder="Type DELETE"
						bind:value={confirmation}
						disabled={deleting}
					/>
				</Field>

				{#if error_message}
					<div class="alert alert-error">
						<span>{error_message}</span>
					</div>
				{/if}
			</div>

			<div class="modal-action">
				<Button
					variant="ghost"
					onclick={close_modal}
					disabled={deleting}
				>
					Cancel
				</Button>
				<Button
					variant="error"
					onclick={handle_delete}
					disabled={deleting || confirmation !== 'DELETE'}
				>
					{#if deleting}
						<span class="loading loading-sm loading-spinner"></span>
						Deleting...
					{:else}
						Delete Account
					{/if}
				</Button>
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={close_modal}></div>
	</dialog>
{/if}
