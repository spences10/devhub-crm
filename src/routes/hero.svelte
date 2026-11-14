<script lang="ts">
	import { Rocket, Sparkles } from '#lib/icons/index.ts';
	import Logo from '#lib/logo.svelte';

	type Props = {
		on_demo_login: () => void;
	};

	let { on_demo_login }: Props = $props();
</script>

<section
	class="hero-section relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent"
>
	<!-- Decorative background pattern -->
	<div
		class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"
	></div>
	<div
		class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.15),transparent_50%)]"
	></div>

	<!-- Floating animated shapes -->
	<div
		class="animate-float-slow absolute top-[20%] left-[10%] hidden size-24 rounded-full bg-accent/30 blur-2xl sm:block md:size-32"
	></div>
	<div
		class="animate-float-medium absolute top-[30%] right-[15%] hidden size-32 rounded-full bg-info/30 blur-2xl sm:block md:size-40"
	></div>
	<div
		class="animate-float-fast absolute bottom-[20%] left-[20%] size-28 rounded-full bg-secondary/30 blur-2xl md:size-36"
	></div>
	<div
		class="animate-float-slow absolute right-[10%] bottom-[30%] hidden size-20 rounded-full bg-success/30 blur-2xl sm:block md:size-28"
	></div>

	<div
		class="relative z-10 mx-auto max-w-6xl text-center text-primary-content"
	>
		<div class="animate-fade-in mb-8 opacity-0 sm:mb-10 md:mb-12">
			<Logo size="120px" class_names="mx-auto drop-shadow-lg" />
		</div>

		<h1
			class="animate-fade-in-up stagger-1 hero-title mb-4 opacity-0 drop-shadow-md sm:mb-5 md:mb-6"
		>
			The CRM Built for Developers
		</h1>

		<p
			class="animate-fade-in-up stagger-2 hero-subtitle mx-auto mb-8 max-w-3xl opacity-0 drop-shadow sm:mb-10 md:mb-12"
		>
			Stop losing track of your network. Devhub CRM helps you manage
			developer relationships with GitHub integration, smart
			follow-ups, and tools that actually fit your workflow.
		</p>

		<div
			class="animate-fade-in-up stagger-3 flex flex-col gap-3 opacity-0 sm:flex-row sm:justify-center sm:gap-4"
		>
			<a
				href="/register"
				class="responsive-btn btn gap-2 shadow-2xl transition-all duration-300 btn-neutral hover:scale-105 hover:shadow-xl"
			>
				<Rocket size="20px" class_names="sm:w-[24px] sm:h-[24px]" />
				Get Started Free
			</a>
			<button
				onclick={on_demo_login}
				class="responsive-btn btn gap-2 border-2 border-accent-content bg-accent text-accent-content shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
			>
				<Sparkles size="20px" class_names="sm:w-[24px] sm:h-[24px]" />
				Try Demo - No Signup
			</button>
			<a
				href="/login"
				class="responsive-btn btn gap-2 border-2 border-primary-content btn-outline text-primary-content shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary-content/10"
			>
				Sign In
			</a>
		</div>

		<p
			class="animate-fade-in stagger-4 mt-4 text-xs text-primary-content/80 opacity-0 sm:mt-5 sm:text-sm md:mt-6"
		>
			No credit card required. Start managing your network in minutes.
		</p>
	</div>
</section>
