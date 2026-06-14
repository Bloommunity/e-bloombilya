<script setup lang="ts">
defineProps<{
	canInstallApp: boolean;
}>();

defineEmits<{
	install: [];
}>();
</script>

<template>
	<header
		class="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:flex-row sm:items-center sm:justify-between sm:p-5 xl:col-span-2"
	>
		<div class="space-y-2">
			<p class="text-[0.62rem] uppercase tracking-[0.5em] text-amber-200/70">
				Virtual Lightstick
			</p>
			<h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
				E-Bloombilya
			</h1>
		</div>

		<div
			class="flex max-w-xl flex-wrap items-center justify-end gap-2 rounded-full border border-white/10 bg-slate-950/35 px-4 py-3 text-sm leading-6 text-slate-300 sm:text-right"
		>
			<span>Tap on, pick a color, then switch modes.</span>
			<button
				v-if="canInstallApp"
				class="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20"
				type="button"
				@click="$emit('install')"
			>
				Install app
			</button>
		</div>
	</header>
</template>
