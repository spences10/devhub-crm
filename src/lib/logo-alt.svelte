<script lang="ts">
	interface Props {
		size?: string;
		class_names?: string;
		d_color?: string;
		pill_color?: string;
		h_color?: string;
	}

	let {
		size = '60px',
		class_names,
		d_color = 'var(--color-base-content)',
		pill_color = 'var(--color-primary)',
		h_color = 'var(--color-primary-content)',
	}: Props = $props();

	// Square aspect ratio for QR code use
	const height = $derived(size);
	const width = $derived(size);
</script>

<svg
	{width}
	{height}
	viewBox="8 14 44 30"
	xmlns="http://www.w3.org/2000/svg"
	class={class_names}
>
	<!-- "D" uppercase - no pill (like "Dev") -->
	<text
		x="10"
		y="38"
		font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
		font-weight="900"
		font-size="24"
		fill={d_color}
		letter-spacing="-1">D</text
	>

	<!-- Pill background for "h" only -->
	<rect
		x="30"
		y="20"
		width="20"
		height="20"
		rx="5"
		ry="5"
		fill={pill_color}
	/>

	<!-- "h" lowercase inside pill (like "hub") -->
	<text
		x="32"
		y="38"
		font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
		font-weight="900"
		font-size="24"
		fill={h_color}
		letter-spacing="-1">h</text
	>
</svg>
