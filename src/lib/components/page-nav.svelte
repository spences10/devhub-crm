<script lang="ts">
	import { page } from '$app/state';
	import { page_nav_items } from '#lib/config/navigation.ts';

	function is_active(path: string) {
		return (
			page.url.pathname === path ||
			page.url.pathname.startsWith(path + '/')
		);
	}
</script>

<nav class="breadcrumbs mb-6 hidden text-sm lg:block">
	<ul>
		{#each page_nav_items as item}
			<li>
				<a
					href={item.href}
					class="flex items-center gap-1.5 {is_active(item.href)
						? 'font-semibold text-primary'
						: ''}"
				>
					<item.icon size="16px" />
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
