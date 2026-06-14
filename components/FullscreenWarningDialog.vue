<script setup lang="ts">
defineProps<{
	open: boolean;
}>();

defineEmits<{
	close: [];
	"remind-later": [];
}>();
</script>

<template>
	<dialog
		v-if="open"
		open
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/68 px-4 py-6 backdrop-blur-sm"
		aria-labelledby="fullscreen-warning-title"
	>
		<div
			class="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-slate-950/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-6"
		>
			<p class="text-[0.62rem] uppercase tracking-[0.5em] text-amber-200/70">
				Fullscreen warning
			</p>
			<h2 id="fullscreen-warning-title" class="mt-3 text-2xl font-semibold text-white">
				Before you go fullscreen on mobile
			</h2>
			<p class="mt-3 text-sm leading-6 text-slate-300">
				When you switch to fullscreen on mobile, the app will force a brighter display
				setting so the lightning effect stays visible and performs better.
			</p>
			<p class="mt-3 text-xs leading-5 text-slate-400">
				Close this alert to continue. You can snooze it for a day if you want.
			</p>
			<div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					class="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
					@click="$emit('close')"
				>
					Close
				</button>
				<button
					type="button"
					class="rounded-full border border-amber-200/20 bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
					@click="$emit('remind-later')"
				>
					Remind me later
				</button>
			</div>
		</div>
	</dialog>
</template>
