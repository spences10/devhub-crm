<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { dock_nav_items } from '#lib/config/navigation.ts';

	function is_active(path: string) {
		return (
			page.url.pathname === path ||
			page.url.pathname.startsWith(path + '/')
		);
	}

	function navigate(href: string) {
		goto(href);
	}
</script>

<!-- Bottom navigation dock - only visible on mobile -->
<div class="dock z-40 lg:hidden">
	{#each dock_nav_items as item}
		<button
			onclick={() => navigate(item.href)}
			class={is_active(item.href) ? 'dock-active' : ''}
		>
			<item.icon size="24px" />
			<span class="dock-label">{item.label}</span>
		</button>
	{/each}
</div>
