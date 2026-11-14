<script lang="ts">
	import {
		Balloon,
		Dashboard,
		Lightbulb,
		Monitor,
		Rocket,
		Sparkles,
		StarFill,
		Target,
		ThumbsUp,
	} from '#lib/icons/index.ts';
	import Logo from '#lib/logo.svelte';

	type Props = {
		user: { name: string; email: string; image?: string | null };
	};

	let { user }: Props = $props();

	// Floating party elements
	const floating_elements = [
		{
			icon: Rocket,
			size: '48px',
			opacity: 'opacity-30',
			animation: 'animate-float-medium',
			position: 'top-[10%] left-[5%]',
			hide_on_mobile: true,
		},
		{
			icon: StarFill,
			size: '40px',
			opacity: 'opacity-30',
			animation: 'animate-float-medium',
			position: 'top-[15%] right-[8%]',
			hide_on_mobile: true,
		},
		{
			icon: Monitor,
			size: '48px',
			opacity: 'opacity-30',
			animation: 'animate-float-medium',
			position: 'top-[70%] left-[15%]',
			hide_on_mobile: false,
		},
		{
			icon: Sparkles,
			size: '40px',
			opacity: 'opacity-30',
			animation: 'animate-float-medium',
			position: 'top-[60%] right-[12%]',
			hide_on_mobile: false,
		},
		{
			icon: Target,
			size: '36px',
			opacity: 'opacity-20',
			animation: 'animate-float-medium',
			position: 'top-[5%] left-[50%]',
			hide_on_mobile: true,
		},
		{
			icon: Balloon,
			size: '40px',
			opacity: 'opacity-30',
			animation: 'animate-float-medium',
			position: 'right-[20%] bottom-[15%]',
			hide_on_mobile: true,
		},
		{
			icon: ThumbsUp,
			size: '36px',
			opacity: 'opacity-20',
			animation: 'animate-float-medium',
			position: 'bottom-[20%] left-[25%]',
			hide_on_mobile: false,
		},
		{
			icon: Lightbulb,
			size: '40px',
			opacity: 'opacity-30',
			animation: 'animate-float-medium',
			position: 'right-[40%] bottom-[10%]',
			hide_on_mobile: true,
		},
	];

	const gradient_orbs = [
		{
			size: 'size-48 sm:size-64',
			color: 'from-primary/20',
			animation: 'animate-float-slow',
			position: 'top-[30%] left-[20%]',
		},
		{
			size: 'size-56 sm:size-72',
			color: 'from-secondary/20',
			animation: 'animate-float-medium',
			position: 'top-[40%] right-[20%]',
		},
		{
			size: 'size-40 sm:size-56',
			color: 'from-accent/20',
			animation: 'animate-float-fast',
			position: 'bottom-[20%] left-[30%]',
		},
	];
</script>

<div
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4 sm:p-6 md:p-8"
>
	<!-- Floating party elements -->
	{#each floating_elements as element}
		<div
			class="absolute {element.position} {element.opacity} {element.animation} {element.hide_on_mobile
				? 'hidden sm:block'
				: ''}"
		>
			<element.icon size={element.size} gradient={true} />
		</div>
	{/each}

	<!-- Animated gradient orbs -->
	{#each gradient_orbs as orb}
		<div
			class="absolute rounded-full bg-gradient-to-br to-transparent blur-3xl {orb.position} {orb.size} {orb.color} {orb.animation}"
		></div>
	{/each}

	<div class="relative z-10 text-center">
		<!-- Logo with pulse animation -->
		<div class="animate-fade-in mb-6 opacity-0 sm:mb-8">
			<Logo size="180px" class_names="mx-auto drop-shadow-2xl" />
		</div>

		<!-- Greeting with gradient text -->
		<h1
			class="animate-fade-in-up stagger-1 hero-title mb-4 opacity-0 drop-shadow-lg"
		>
			<span
				class="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
			>
				Welcome back, {user.name}!
			</span>
		</h1>

		<!-- Animated message -->
		<div class="animate-fade-in-up stagger-2 mb-6 opacity-0 sm:mb-8">
			<p class="hero-subtitle mb-2 text-base-content/80">
				Ready to level up your network?
			</p>
			<p class="text-xs font-medium text-base-content/50 sm:text-sm">
				(We didn't need to make this page special, but here we are 😊)
			</p>
		</div>

		<!-- CTA with hover effects -->
		<a
			href="/dashboard"
			class="animate-fade-in-up stagger-3 group responsive-btn btn relative overflow-hidden opacity-0 shadow-2xl transition-all duration-300 btn-primary hover:scale-110 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]"
		>
			<span class="relative z-10 flex items-center gap-2">
				<Dashboard
					size="20px"
					class_names="sm:w-[24px] sm:h-[24px]"
				/>
				Go to Dashboard
			</span>
			<!-- Animated shine effect -->
			<div
				class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
			></div>
		</a>

		<!-- Fun stats or Easter egg message -->
		<div class="animate-fade-in stagger-4 mt-8 opacity-0 sm:mt-12">
			<div
				class="inline-block rounded-box border border-base-300 bg-base-100/80 px-6 py-3 shadow-xl backdrop-blur-sm sm:px-8 sm:py-4"
			>
				<p
					class="text-xs font-semibold text-base-content/70 sm:text-sm"
				>
					You found the secret welcome screen! 🎊
				</p>
				<p class="mt-1 text-xs text-base-content/50">
					Most users never see this because they go straight to the
					dashboard.
				</p>
			</div>
		</div>
	</div>
</div>
