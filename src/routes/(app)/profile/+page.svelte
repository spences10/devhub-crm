<script lang="ts">
	import { page } from '$app/state';
	import BaseCard from '#lib/components/base-card.svelte';
	import PageNav from '#lib/components/page-nav.svelte';
	import SocialLinksManager from '#lib/components/social-links-manager.svelte';
	import {
		Field,
		Input,
		Radio,
		Textarea,
	} from '#lib/components/ui/index.ts';
	import { Email, GitHub } from '#lib/icons/index.ts';
	import { seo_configs } from '#lib/seo.ts';
	import { generate_qr_code_data_url } from '#lib/utils/qr-code.ts';
	import { Head } from 'svead';
	import { onMount } from 'svelte';
	import { is_demo_user } from '../layout.remote';
	import DeleteAccountModal from './delete-account-modal.svelte';
	import {
		add_user_social_link,
		delete_account,
		delete_user_social_link,
		disconnect_github,
		get_connected_auth_methods,
		get_github_connection_status,
		get_profile_qr_url,
		get_user_profile,
		get_user_qr_code,
		get_user_social_links,
		save_qr_code,
		update_bio,
		update_email,
		update_location,
		update_name,
		update_tagline,
		update_username,
		update_visibility,
		update_website,
	} from './profile.remote';

	const profile = get_user_profile();
	const social_links = get_user_social_links();
	const auth_methods = get_connected_auth_methods();
	const github_status = get_github_connection_status();
	const user_qr = get_user_qr_code();
	const is_demo = is_demo_user();

	let saving = $state(false);
	let generating_qr = $state(false);
	let qr_code_url = $state<string | null>(null);

	onMount(async () => {
		const url = await user_qr;
		qr_code_url = url;
	});

	async function save_with_indicator(fn: () => Promise<void>) {
		saving = true;
		await fn();
		await profile.refresh();
		setTimeout(() => (saving = false), 500);
	}

	async function handle_generate_qr() {
		generating_qr = true;
		try {
			const profile_url = await get_profile_qr_url(page.url.origin);
			const data_url = await generate_qr_code_data_url(profile_url);
			await save_qr_code({ qr_code_url: data_url });
			qr_code_url = data_url;
		} catch (error) {
			console.error('Failed to generate QR code:', error);
		} finally {
			generating_qr = false;
		}
	}

	async function handle_disconnect_github() {
		if (
			!confirm(
				'Are you sure you want to disconnect your GitHub account?',
			)
		)
			return;

		try {
			await disconnect_github(undefined);
			await github_status.refresh();
			await profile.refresh();
		} catch (err) {
			console.error('Failed to disconnect GitHub:', err);
		}
	}
</script>

<Head seo_config={seo_configs.settings} />

<div class="mb-8 flex items-center justify-between">
	<div>
		<h1 class="text-3xl font-bold">Profile Settings</h1>
	</div>
	{#if saving}
		<span class="badge badge-lg badge-success">Saving...</span>
	{/if}
</div>
<PageNav />

{#await profile}
	<div class="flex justify-center">
		<span class="loading loading-lg loading-spinner"></span>
	</div>
{:then profile_data}
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Account & Security -->
		<BaseCard class="md:col-span-2">
			{#snippet children()}
				<h2 class="card-title">Account & Security</h2>
				<p class="text-sm opacity-70">
					Manage your account information, authentication methods, and
					privacy settings
				</p>

				<!-- Personal Information -->
				<div class="mt-4">
					<h3 class="mb-3 font-semibold">Personal Information</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#await is_demo then demo}
							<Field legend="Name">
								<Input
									type="text"
									name="name"
									value={profile_data.name}
									disabled={demo}
									onblur={(e) =>
										save_with_indicator(() =>
											update_name(e.currentTarget.value),
										)}
								/>
								{#if demo}
									<p class="mt-1 text-xs opacity-60">
										Cannot modify demo account
									</p>
								{/if}
							</Field>
						{/await}

						{#await is_demo then demo}
							<Field legend="Email">
								<Input
									type="email"
									name="email"
									value={profile_data.email}
									disabled={demo}
									onblur={(e) =>
										save_with_indicator(() =>
											update_email(e.currentTarget.value),
										)}
								/>
								{#if demo}
									<p class="mt-1 text-xs opacity-60">
										Cannot modify demo account
									</p>
								{/if}
							</Field>
						{/await}
					</div>
				</div>

				<div class="divider"></div>

				<!-- Authentication Methods & Privacy -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Authentication Methods -->
					{#await auth_methods then methods}
						<div>
							<h3 class="mb-3 font-semibold">
								Authentication Methods
							</h3>
							<div class="space-y-3">
								<!-- Email/Password -->
								<div
									class="flex items-center justify-between rounded-box border border-base-300 p-4"
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-base-200"
										>
											<Email size="20px" />
										</div>
										<div>
											<div class="font-medium">Email & Password</div>
											<div class="text-sm opacity-60">
												{#if methods.has_credential}
													Password is set
												{:else}
													No password set
												{/if}
											</div>
										</div>
									</div>
									<a
										href="/forgot-password?mode=setup&email={encodeURIComponent(
											profile_data.email,
										)}"
										class="btn btn-outline btn-sm"
									>
										{methods.has_credential
											? 'Change Password'
											: 'Set Password'}
									</a>
								</div>

								<!-- GitHub -->
								<div
									class="flex items-center justify-between rounded-box border border-base-300 p-4"
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-base-200"
										>
											<GitHub size="20px" />
										</div>
										<div>
											<div class="font-medium">GitHub</div>
											<div class="text-sm opacity-60">
												{#if methods.has_github}
													Connected as
													<strong>{methods.github_username}</strong>
												{:else}
													Not connected
												{/if}
											</div>
										</div>
									</div>
									{#if methods.has_github}
										<button
											onclick={handle_disconnect_github}
											class="btn btn-outline btn-error btn-sm"
										>
											Disconnect
										</button>
									{:else}
										<a
											href="/api/auth/signin/github"
											class="btn btn-outline btn-sm"
										>
											Connect
										</a>
									{/if}
								</div>
							</div>
						</div>
					{/await}

					<!-- Privacy Settings -->
					<div>
						<div class="mb-2 flex items-center gap-2">
							<h3 class="font-semibold">Privacy</h3>
							<span class="text-xs font-bold opacity-60">
								Control who can see your public profile
							</span>
						</div>
						<div class="space-y-3">
							<label class="flex cursor-pointer items-center gap-3">
								<Radio
									name="visibility"
									value="public"
									checked={profile_data.visibility === 'public'}
									onchange={() =>
										save_with_indicator(() =>
											update_visibility('public'),
										)}
								/>
								<div class="flex flex-col">
									<span class="font-medium">Public</span>
									<span class="text-sm opacity-60">
										Anyone can view your profile
									</span>
								</div>
							</label>

							<label class="flex cursor-pointer items-center gap-3">
								<Radio
									name="visibility"
									value="unlisted"
									checked={profile_data.visibility === 'unlisted'}
									onchange={() =>
										save_with_indicator(() =>
											update_visibility('unlisted'),
										)}
								/>
								<div class="flex flex-col">
									<span class="font-medium">Unlisted</span>
									<span class="text-sm opacity-60">
										Only people with the link can view
									</span>
								</div>
							</label>

							<label class="flex cursor-pointer items-center gap-3">
								<Radio
									name="visibility"
									value="private"
									checked={profile_data.visibility === 'private'}
									onchange={() =>
										save_with_indicator(() =>
											update_visibility('private'),
										)}
								/>
								<div class="flex flex-col">
									<span class="font-medium">Private</span>
									<span class="text-sm opacity-60">
										Only logged-in users can view
									</span>
								</div>
							</label>
						</div>
					</div>
				</div>
			{/snippet}
		</BaseCard>

		<!-- Public Profile -->
		<BaseCard class="md:col-span-2">
			{#snippet children()}
				<h2 class="card-title">Public Profile</h2>
				<p class="text-sm opacity-70">
					Information displayed on your public profile page
				</p>

				<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
					{#await is_demo then demo}
						<Field>
							{#snippet legend()}
								Username
								<span class="text-xs opacity-60">
									(devhub.party/@{profile_data.username})
								</span>
							{/snippet}
							<Input
								type="text"
								name="username"
								value={profile_data.username}
								disabled={demo}
								onblur={(e) =>
									save_with_indicator(() =>
										update_username(e.currentTarget.value),
									)}
							/>
							{#if demo}
								<p class="mt-1 text-xs opacity-60">
									Cannot modify demo account
								</p>
							{/if}
						</Field>
					{/await}

					<Field legend="Tagline">
						<Input
							type="text"
							name="tagline"
							value={profile_data.tagline || ''}
							placeholder="Your professional title or tagline"
							onblur={(e) =>
								save_with_indicator(() =>
									update_tagline(e.currentTarget.value),
								)}
						/>
					</Field>

					<Field legend="Location">
						<Input
							type="text"
							name="location"
							value={profile_data.location || ''}
							placeholder="City, Country"
							onblur={(e) =>
								save_with_indicator(() =>
									update_location(e.currentTarget.value),
								)}
						/>
					</Field>

					<Field legend="Website">
						<Input
							type="url"
							name="website"
							value={profile_data.website || ''}
							placeholder="https://example.com"
							onblur={(e) =>
								save_with_indicator(() =>
									update_website(e.currentTarget.value),
								)}
						/>
					</Field>

					<div class="md:col-span-2">
						<Field legend="Bio">
							<Textarea
								name="bio"
								rows={3}
								placeholder="Tell others about yourself"
								value={profile_data.bio || ''}
								onblur={(e) =>
									save_with_indicator(() =>
										update_bio(e.currentTarget.value),
									)}
							/>
						</Field>
					</div>
				</div>
			{/snippet}
		</BaseCard>

		<!-- Social Links -->
		<BaseCard>
			{#snippet children()}
				<h2 class="card-title">Social Links</h2>
				<p class="text-sm opacity-70">
					Add links to your social media profiles
				</p>

				{#await social_links then links}
					<SocialLinksManager
						social_links={links || []}
						on_add={async (platform: string, url: string) => {
							await add_user_social_link({ platform, url }).updates(
								social_links,
							);
						}}
						on_delete={async (link_id: string) => {
							await delete_user_social_link(link_id).updates(
								social_links,
							);
						}}
					/>
				{/await}
			{/snippet}
		</BaseCard>

		<!-- QR Code -->
		<BaseCard>
			{#snippet children()}
				<h2 class="card-title">Profile QR Code</h2>
				<p class="text-sm opacity-70">
					Your unique QR code that links to your public profile
				</p>

				<div
					class="mt-4 flex flex-col items-center gap-4 md:flex-row"
				>
					{#if generating_qr}
						<div
							class="flex h-64 w-64 items-center justify-center rounded-box border-2 border-dashed border-base-300"
						>
							<span class="loading loading-lg loading-spinner"></span>
						</div>
					{:else if qr_code_url}
						<div class="flex flex-col items-center gap-4">
							<img
								src={qr_code_url}
								alt="Profile QR Code"
								class="w-64 rounded-box border-2 border-base-300"
							/>
							<button
								class="btn btn-outline btn-sm"
								onclick={handle_generate_qr}
							>
								Regenerate
							</button>
						</div>
					{:else}
						<div
							class="flex h-64 w-64 items-center justify-center rounded-box border-2 border-dashed border-base-300"
						>
							<button
								class="btn btn-primary"
								onclick={handle_generate_qr}
							>
								Generate QR Code
							</button>
						</div>
					{/if}

					<div class="flex-1">
						<h3 class="mb-2 font-semibold">How to use:</h3>
						<ul class="list-inside list-disc space-y-1 text-sm">
							<li>Download and add it to your business card</li>
							<li>
								People can scan it to instantly view and save your
								contact info
							</li>
							<li>Share it at conferences and networking events</li>
							<li>Track scans in your analytics (coming soon)</li>
						</ul>
					</div>
				</div>
			{/snippet}
		</BaseCard>

		<!-- Delete Account - Danger Zone -->
		<div class="md:col-span-2">
			<DeleteAccountModal on_delete={delete_account} />
		</div>
	</div>
{:catch error}
	<div class="alert alert-error">
		<span>Failed to load profile: {error.message}</span>
	</div>
{/await}
