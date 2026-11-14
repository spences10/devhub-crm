<script lang="ts">
	import { Rocket, Sparkles } from '#lib/icons/index.ts';

	type Props = {
		on_demo_login: () => void;
	};

	let { on_demo_login }: Props = $props();
</script>

<section class="section-padding bg-base-100">
	<div
		class="card-padding relative mx-auto max-w-4xl rounded-box border border-primary/20 bg-gradient-to-br from-primary to-primary/80 text-center shadow-2xl"
	>
		<!-- Decorative background -->
		<div
			class="absolute inset-0 rounded-box bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)]"
		></div>

		<div class="relative z-10">
			<h2
				class="section-title mb-4 text-primary-content drop-shadow-md sm:mb-5 md:mb-6"
			>
				Ready to Level Up Your Network?
			</h2>
			<p
				class="hero-subtitle mb-8 text-primary-content/90 drop-shadow sm:mb-9 md:mb-10"
			>
				Join developers who are building better relationships without
				the busy work.
			</p>

			<div
				class="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
			>
				<a
					href="/register"
					class="responsive-btn btn gap-2 shadow-2xl transition-all duration-300 btn-neutral hover:scale-105 hover:shadow-xl"
				>
					<Rocket size="20px" class_names="sm:w-[24px] sm:h-[24px]" />
					Create Free Account
				</a>
				<button
					onclick={on_demo_login}
					class="responsive-btn btn gap-2 border-2 border-base-100 btn-outline text-base-100 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-base-100/10"
				>
					<Sparkles
						size="20px"
						class_names="sm:w-[24px] sm:h-[24px]"
					/>
					Try Demo Now
				</button>
				<a
					href="/login"
					class="responsive-btn btn border-2 border-primary-content btn-outline text-primary-content shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary-content/10"
				>
					Sign In
				</a>
			</div>

			<p
				class="mt-6 text-xs font-medium text-primary-content/80 sm:mt-7 sm:text-sm md:mt-8"
			>
				Free forever for core features. Premium features coming soon.
			</p>
		</div>
	</div>
</section>
