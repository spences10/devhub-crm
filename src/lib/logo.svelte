<script lang="ts">
	interface Props {
		size?: string;
		class_names?: string;
		dev_text_color?: string;
		hub_bg_color?: string;
		hub_text_color?: string;
	}

	let {
		size = '60px',
		class_names,
		dev_text_color = 'var(--color-base-content)',
		hub_bg_color = 'var(--color-primary)',
		hub_text_color = 'var(--color-primary-content)',
	}: Props = $props();

	// Aspect ratio from viewBox: 120:60 = 2:1
	const ratio = 120 / 60;
	const height = $derived(size);
	const width = $derived(`calc(${size} * ${ratio})`);
</script>

<svg
	{width}
	{height}
	viewBox="0 0 120 60"
	xmlns="http://www.w3.org/2000/svg"
	class={class_names}
>
	<!-- "dev" text group -->
	<g id="dev-text" transform="translate(10, 38)">
		<text
			x="0"
			y="0"
			font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
			font-weight="900"
			font-size="24"
			fill={dev_text_color}
			letter-spacing="-1">Dev</text
		>
	</g>

	<!-- "hub" capsule group (rectangle + text) -->
	<g id="hub-capsule" transform="translate(60, 16)">
		<!-- Orange rounded rectangle -->
		<rect
			x="0"
			y="0"
			width="51"
			height="28"
			rx="3"
			ry="3"
			fill={hub_bg_color}
		/>

		<!-- "hub" text in white -->
		<text
			x="2"
			y="22"
			font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
			font-weight="900"
			font-size="24"
			fill={hub_text_color}
			letter-spacing="-1">hub</text
		>

		<!-- "CRM" text in smaller size -->
		<text
			x="35"
			y="35"
			font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
			font-weight="700"
			font-size="10"
			fill={dev_text_color}
			letter-spacing="-0.5">CRM</text
		>
	</g>
</svg>
