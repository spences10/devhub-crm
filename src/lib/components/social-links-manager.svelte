<script lang="ts">
	import { Trash } from '#lib/icons/index.ts';
	import ConfirmDialog from './confirm-dialog.svelte';
	import SocialLinkIcon from './social-link.svelte';
	import Surface from './surface.svelte';
	import { Button, Field, Input } from './ui';

	interface SocialLink {
		id: string;
		platform: string;
		url: string;
	}

	interface Props {
		social_links: SocialLink[];
		on_add: (platform: string, url: string) => Promise<void>;
		on_delete: (link_id: string) => Promise<void>;
	}

	let { social_links, on_add, on_delete }: Props = $props();

	// New social link state
	let new_url = $state('');
	let adding_link = $state(false);
	let delete_confirmation_id = $state<string | null>(null);

	function detect_platform(url: string): string {
		try {
			const normalized_url = url.includes('://')
				? url
				: `https://${url}`;
			const hostname = new URL(normalized_url).hostname.toLowerCase();

			if (hostname.includes('github.com')) return 'github';
			if (
				hostname.includes('twitter.com') ||
				hostname.includes('x.com')
			)
				return 'twitter';
			if (
				hostname.includes('bsky.app') ||
				hostname.includes('bluesky.')
			)
				return 'bluesky';
			if (hostname.includes('linkedin.com')) return 'linkedin';
			if (
				hostname.includes('mastodon.') ||
				hostname.includes('fosstodon.') ||
				hostname.includes('mas.to')
			)
				return 'mastodon';

			return 'website';
		} catch {
			return 'website';
		}
	}

	async function handle_add_social_link() {
		if (!new_url) return;

		// Auto-add https:// if no protocol specified
		let url_to_add = new_url.trim();
		if (!/^https?:\/\//i.test(url_to_add)) {
			url_to_add = `https://${url_to_add}`;
		}

		const platform = detect_platform(url_to_add);

		adding_link = true;
		try {
			await on_add(platform, url_to_add);
			new_url = '';
		} catch (err) {
			console.error('Failed to add social link:', err);
		} finally {
			adding_link = false;
		}
	}

	function handle_delete_click(link_id: string) {
		delete_confirmation_id = link_id;
	}

	async function confirm_delete() {
		if (!delete_confirmation_id) return;

		try {
			await on_delete(delete_confirmation_id);
			delete_confirmation_id = null;
		} catch (err) {
			console.error('Failed to delete social link:', err);
		}
	}

	function cancel_delete() {
		delete_confirmation_id = null;
	}
</script>

<Surface>
	<p class="mb-3 text-sm font-medium">Social Links</p>

	<!-- Existing Social Links -->
	{#if social_links && social_links.length > 0}
		<div class="mb-4 space-y-2">
			{#each social_links as link}
				<div class="flex items-center justify-between gap-2">
					<div class="flex items-center gap-2">
						<SocialLinkIcon platform={link.platform} />
						<span class="text-sm font-medium capitalize">
							{link.platform}:
						</span>
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="link text-sm link-primary"
						>
							{link.url}
						</a>
					</div>
					{#if delete_confirmation_id === link.id}
						<ConfirmDialog
							is_inline={true}
							message="Remove?"
							on_confirm={confirm_delete}
							on_cancel={cancel_delete}
						/>
					{:else}
						<Button
							type="button"
							variant="ghost"
							size="xs"
							onclick={() => handle_delete_click(link.id)}
							aria-label="Remove social link"
						>
							<Trash size="16px" class_names="text-error" />
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add New Social Link -->
	<div class="space-y-3">
		<p class="text-xs font-medium opacity-70">Add new social link</p>
		<Field legend="URL">
			<Input
				type="url"
				name="social_url"
				placeholder="https://github.com/username or https://example.com"
				bind:value={new_url}
			/>
		</Field>
		<Button
			variant="primary"
			onclick={handle_add_social_link}
			disabled={adding_link || !new_url}
			loading={adding_link}
			class="btn-block"
		>
			Add
		</Button>
	</div>
</Surface>
