<script setup lang="ts">
const props = defineProps<{
	currentColor: string;
	currentFaceSrc: string;
	glowVisible: boolean;
	isOn: boolean;
	isFullscreen: boolean;
	fullscreenBrightness: number;
	glowStyle: (colorHex: string, brightnessScale?: number) => Record<string, string>;
	faceBrightnessStyle: (brightnessScale: number) => Record<string, string>;
	imageGlowStyle: (colorHex: string) => Record<string, string>;
}>();

const emit = defineEmits<{
	"toggle-fullscreen": [];
	"toggle-power": [];
	"stage-ready": [element: HTMLElement | null];
	"glow-ready": [element: HTMLElement | null];
}>();

const stageEl = ref<HTMLElement | null>(null);
const glowEl = ref<HTMLElement | null>(null);

onMounted(() => {
	emit("stage-ready", stageEl.value);
	emit("glow-ready", glowEl.value);
});

onBeforeUnmount(() => {
	emit("stage-ready", null);
	emit("glow-ready", null);
});
</script>

<template>
	<section
		ref="stageEl"
		class="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/48 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6 xl:min-w-0"
		:class="
			isFullscreen
				? '!fixed !inset-0 !z-50 !rounded-none !border-0 !bg-black !p-0 !shadow-none'
				: ''
		"
	>
		<div
			ref="glowEl"
			class="pointer-events-none absolute left-1/2 top-1/2 z-0 rounded-full transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform]"
			:class="[
				glowVisible ? 'scale-100 opacity-100' : 'scale-[0.94] opacity-0',
				isFullscreen
					? '!h-[140vmax] !w-[140vmax] -translate-x-1/2 -translate-y-1/2 !blur-[120px]'
					: 'h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 sm:h-[64vmin] sm:w-[64vmin] xl:h-[52rem] xl:w-[52rem]',
			]"
			:style="glowStyle(currentColor, isFullscreen ? fullscreenBrightness : 1)"
			aria-hidden="true"
		/>

		<button
			class="absolute right-4 top-4 z-40 rounded-full border border-white/15 bg-slate-950/84 px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_36px_rgba(0,0,0,0.35)] transition hover:bg-slate-950"
			type="button"
			@click="$emit('toggle-fullscreen')"
		>
			{{ isFullscreen ? "Exit fullscreen" : "Fullscreen" }}
		</button>

		<div
			class="relative z-10 flex w-full items-center justify-center"
			:class="isFullscreen ? 'h-full' : ''"
		>
			<div
				class="relative flex aspect-square w-[min(72vmin,540px)] items-center justify-center sm:w-[min(64vmin,620px)] lg:w-[min(54vmin,680px)] xl:w-[min(100%,720px)]"
				:class="isFullscreen ? '!w-[min(92vmin,1000px)]' : ''"
			>
				<div
					class="face-mask relative flex h-[86%] w-[86%] items-center justify-center overflow-hidden rounded-full"
				>
					<div
						class="pointer-events-none absolute inset-[-6%] rounded-full transition-opacity duration-300"
						:class="glowVisible ? 'opacity-100' : 'opacity-0'"
						:style="imageGlowStyle(currentColor)"
						aria-hidden="true"
					/>

					<img
						class="relative z-10 h-full w-full select-none object-cover object-center opacity-90 transition duration-200"
						:class="
							isOn
								? 'mix-blend-screen'
								: 'grayscale-[65%] brightness-75 opacity-70 mix-blend-normal'
						"
						:style="
							isFullscreen ? faceBrightnessStyle(fullscreenBrightness) : undefined
						"
						:src="currentFaceSrc"
						:key="currentFaceSrc"
						width="512"
						height="512"
						loading="eager"
						fetchpriority="high"
						decoding="async"
						alt="BINI bloombilya lightstick"
					/>
				</div>

				<button
					class="absolute left-[49.2%] top-[52.5%] z-30 flex h-[clamp(1.55rem,2.4vmin,1.9rem)] w-[clamp(1.55rem,2.4vmin,1.9rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200/25 bg-[linear-gradient(180deg,rgba(255,236,145,0.98),rgba(255,186,63,0.98))] p-0 shadow-[0_8px_18px_rgba(255,187,64,0.3),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.24)] transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20"
					type="button"
					aria-label="Toggle power"
					title="Toggle power"
					@click="$emit('toggle-power')"
				>
					<span
						class="inline-flex items-center justify-center rounded-full text-[clamp(0.8rem,1.25vmin,0.95rem)] leading-none text-[#ff9f00] drop-shadow-[0_2px_8px_rgba(255,180,40,0.4)]"
					>
						★
					</span>
				</button>
			</div>
		</div>
	</section>
</template>
