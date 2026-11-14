<script lang="ts">
	import { Button } from './ui';
	import { Check, Cross } from '#lib/icons/index.ts';

	interface Props {
		message?: string;
		confirm_label?: string;
		cancel_label?: string;
		is_inline?: boolean;
		show_icons?: boolean;
		on_confirm?: () => void | Promise<void>;
		on_cancel?: () => void | Promise<void>;
	}

	let {
		message = 'Are you sure?',
		confirm_label = 'Confirm',
		cancel_label = 'Cancel',
		is_inline = false,
		show_icons = true,
		on_confirm = () => {},
		on_cancel = () => {},
	}: Props = $props();

	async function handle_confirm(event?: Event) {
		if (event) event.stopPropagation();
		await on_confirm();
	}

	async function handle_cancel(event?: Event) {
		if (event) event.stopPropagation();
		await on_cancel();
	}
</script>

{#if is_inline}
	<div class="flex items-center gap-2">
		<span class="mr-2 text-xs text-error">{message}</span>
		<Button
			variant="ghost"
			size="xs"
			class="btn-error"
			aria-label={confirm_label}
			onclick={handle_confirm}
		>
			{#if show_icons}
				<Check size="20px" />
			{:else}
				{confirm_label}
			{/if}
		</Button>
		<Button
			variant="ghost"
			size="xs"
			aria-label={cancel_label}
			onclick={handle_cancel}
		>
			{#if show_icons}
				<Cross size="20px" />
			{:else}
				{cancel_label}
			{/if}
		</Button>
	</div>
{:else}
	<div class="flex items-center gap-2">
		<Button
			variant="error"
			size="sm"
			aria-label={confirm_label}
			onclick={handle_confirm}
		>
			{#if show_icons}
				<Check size="20px" />
			{/if}
			{confirm_label}
		</Button>
		<Button
			variant="outline"
			size="sm"
			aria-label={cancel_label}
			onclick={handle_cancel}
		>
			{#if show_icons}
				<Cross size="20px" />
			{/if}
			{cancel_label}
		</Button>
	</div>
{/if}
