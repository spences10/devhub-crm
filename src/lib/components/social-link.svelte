<script lang="ts">
	import { get_platform_icon } from '#lib/utils/social-icons.ts';

	interface Props {
		platform: string;
	}

	let { platform }: Props = $props();

	const Icon = $derived(get_platform_icon(platform));
</script>

<Icon />
