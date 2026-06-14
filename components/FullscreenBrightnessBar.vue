<script setup lang="ts">
defineProps<{
	isFullscreen: boolean;
	isMobileFullscreen: boolean;
}>();

const modelValue = defineModel<number>({ required: true });
</script>

<template>
	<div
		v-if="isFullscreen"
		class="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(92vw,26rem)] rounded-[1.25rem] border border-white/10 bg-slate-950/88 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-md md:hidden"
	>
		<div
			class="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300"
		>
			<span>Brightness</span>
			<span>{{ Math.round(modelValue * 100) }}%</span>
		</div>
		<input
			v-model.number="modelValue"
			:disabled="isMobileFullscreen"
			class="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-amber-300"
			type="range"
			min="0.7"
			max="1.6"
			step="0.01"
			aria-label="Fullscreen brightness"
		/>
		<p v-if="isMobileFullscreen" class="mt-2 text-[0.72rem] leading-5 text-slate-300">
			Mobile fullscreen uses a forced brightness boost so the lighting effect stays clear.
		</p>
	</div>
</template>
