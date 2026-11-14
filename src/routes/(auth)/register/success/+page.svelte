<script lang="ts">
	import AuthHeroPanel from '#lib/components/auth-hero-panel.svelte';
	import {
		CheckCircleFill,
		Email,
		InformationCircle,
	} from '#lib/icons/index.ts';
	import Logo from '#lib/logo.svelte';

	const steps = [
		{ text: 'Check your inbox (and spam folder)', stagger: '4' },
		{ text: 'Click the verification link', stagger: '4' },
		{ text: 'Start building your CRM', stagger: '5' },
	];
</script>

<div class="fixed inset-0 flex min-h-screen">
	<!-- Left Panel - Email Illustration -->
	<AuthHeroPanel>
		<div class="mb-10 flex items-center justify-between gap-8">
			<div class="animate-fade-in opacity-0">
				<Logo size="90px" class_names="drop-shadow-lg" />
			</div>

			<div
				class="animate-scale-in stagger-1 flex-shrink-0 rounded-box border border-primary-content/25 bg-primary-content/15 p-6 text-center opacity-0 shadow-2xl backdrop-blur-sm"
			>
				<Email
					size="80px"
					class_names="text-success drop-shadow-lg"
				/>
			</div>
		</div>

		<h1
			class="animate-fade-in-up stagger-2 mb-6 text-center text-5xl leading-tight font-extrabold text-primary-content opacity-0 drop-shadow-md"
		>
			You're Almost There!
		</h1>
		<p
			class="animate-fade-in-up stagger-3 mb-12 text-center text-xl leading-relaxed font-medium text-primary-content opacity-0 drop-shadow"
		>
			We've sent a verification link to your email. Click it to
			activate your account and start managing your developer
			relationships.
		</p>

		<div class="space-y-4">
			{#each steps as step}
				<div
					class="animate-fade-in-up stagger-{step.stagger} flex items-center gap-4 rounded-box border border-primary-content/20 bg-primary-content/10 p-4 opacity-0 shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-105"
				>
					<CheckCircleFill
						size="24px"
						class_names="flex-shrink-0 text-primary-content drop-shadow"
					/>
					<span class="text-lg font-medium text-primary-content">
						{step.text}
					</span>
				</div>
			{/each}
		</div>
	</AuthHeroPanel>

	<!-- Right Panel - Instructions -->
	<div
		class="flex w-full items-center justify-center bg-base-100 p-8 lg:w-1/2"
	>
		<div class="w-full max-w-md">
			<!-- Mobile logo -->
			<div class="animate-fade-in mb-8 opacity-0 lg:hidden">
				<Logo size="60px" class_names="mx-auto" />
			</div>

			<div class="text-center">
				<div
					class="animate-scale-in stagger-1 mb-8 inline-block rounded-full bg-success/15 p-6 opacity-0 shadow-lg ring-4 ring-success/10"
				>
					<CheckCircleFill size="64px" class_names="text-success" />
				</div>

				<h2
					class="animate-fade-in-up stagger-2 mb-3 text-3xl font-bold text-base-content opacity-0"
				>
					Check Your Email
				</h2>

				<p
					class="animate-fade-in-up stagger-3 mb-8 text-lg leading-relaxed text-base-content/70 opacity-0"
				>
					We've sent a verification link to your email address. Click
					the link to verify your account and get started.
				</p>

				<div
					class="animate-fade-in-up stagger-4 mb-8 rounded-box border border-info/20 bg-info/10 p-5 text-left opacity-0 shadow-sm transition-shadow duration-300 hover:shadow-md"
				>
					<div class="flex gap-4">
						<InformationCircle
							size="24px"
							class_names="mt-0.5 flex-shrink-0 text-info"
						/>
						<div>
							<p class="mb-1 text-base font-bold text-info">
								Didn't receive the email?
							</p>
							<p class="leading-relaxed text-base-content/70">
								Check your spam or junk folder. The email should
								arrive within a few minutes.
							</p>
						</div>
					</div>
				</div>

				<a
					href="/login"
					class="animate-fade-in-up stagger-5 btn mb-5 btn-block opacity-0 shadow-lg transition-all duration-300 btn-lg btn-primary hover:scale-105 hover:shadow-xl active:scale-95"
				>
					Back to Login
				</a>

				<p
					class="animate-fade-in stagger-5 text-sm font-medium text-base-content/50 opacity-0"
				>
					The verification link will expire in 24 hours
				</p>
			</div>
		</div>
	</div>
</div>
