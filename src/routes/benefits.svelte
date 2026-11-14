<script lang="ts">
	import {
		CheckCircleFill,
		ContactBook,
		GitHub,
	} from '#lib/icons/index.ts';

	type Props = {
		benefits: string[];
	};

	let { benefits }: Props = $props();
</script>

<section
	class="section-padding border-y border-base-300 bg-base-200 shadow-inner"
>
	<div class="mx-auto max-w-6xl">
		<div
			class="grid items-center gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2"
		>
			<div>
				<div
					class="mb-4 inline-block rounded-full bg-primary/10 p-3 sm:mb-5 sm:p-4 md:mb-6"
				>
					<ContactBook
						size="36px"
						class_names="text-primary sm:w-[42px] sm:h-[42px] md:w-[48px] md:h-[48px]"
					/>
				</div>
				<h2
					class="section-title mb-4 text-base-content sm:mb-5 md:mb-6"
				>
					Why Developers Love Devhub
				</h2>
				<p
					class="mb-6 text-base leading-relaxed text-base-content/70 sm:mb-7 sm:text-lg md:mb-8 md:text-xl"
				>
					Traditional CRMs weren't built for how developers network.
					We are.
				</p>

				<div class="space-y-3 sm:space-y-4">
					{#each benefits as benefit}
						<div class="flex items-start gap-3 sm:gap-4">
							<CheckCircleFill
								size="20px"
								class_names="mt-1 flex-shrink-0 text-success sm:w-[22px] sm:h-[22px] md:w-[24px] md:h-[24px]"
							/>
							<p
								class="text-sm text-base-content/90 sm:text-base md:text-lg"
							>
								{benefit}
							</p>
						</div>
					{/each}
				</div>
			</div>

			<div
				class="rounded-box border border-base-300 bg-base-100 p-6 shadow-2xl sm:p-8 md:p-10 lg:p-12"
			>
				<div class="space-y-4 sm:space-y-5 md:space-y-6">
					<div
						class="rounded-box border border-base-300 bg-base-200/50 p-4 sm:p-5 md:p-6"
					>
						<div
							class="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3"
						>
							<GitHub
								size="28px"
								class_names="text-base-content sm:w-[30px] sm:h-[30px] md:w-[32px] md:h-[32px]"
							/>
							<h3
								class="text-lg font-bold text-base-content sm:text-xl"
							>
								GitHub Integration
							</h3>
						</div>
						<p class="text-sm text-base-content/70 sm:text-base">
							Import your network in seconds. Track contributions,
							stars, and collaborations automatically.
						</p>
					</div>

					<div
						class="rounded-box border border-base-300 bg-base-200/50 p-4 sm:p-5 md:p-6"
					>
						<h3
							class="mb-2 text-lg font-bold text-base-content sm:mb-3 sm:text-xl"
						>
							CLI Tool (Coming Soon)
						</h3>
						<code
							class="block rounded bg-base-300 p-2 font-mono text-xs text-base-content/90 sm:p-3 sm:text-sm"
						>
							$ devhub log @username "met at conf"
						</code>
					</div>

					<div
						class="rounded-box border border-base-300 bg-base-200/50 p-4 sm:p-5 md:p-6"
					>
						<h3
							class="mb-2 text-lg font-bold text-base-content sm:mb-3 sm:text-xl"
						>
							Your Data, Your Control
						</h3>
						<p class="text-sm text-base-content/70 sm:text-base">
							SQLite database. Full export anytime. Self-host if you
							want. Zero lock-in.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
