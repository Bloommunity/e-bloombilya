<script setup lang="ts">
type Mode = "fixed" | "random" | "blink";

type Swatch = {
	label: string;
	color: string;
	ready?: boolean;
};

const modes: Mode[] = ["fixed", "random", "blink"];

defineProps<{
	controlsOpen: boolean;
	isFullscreen: boolean;
	isOn: boolean;
	currentMode: Mode;
	currentColor: string;
	swatches: Swatch[];
}>();

defineEmits<{
	"toggle-controls": [];
	"turn-on": [];
	"turn-off": [];
	"set-mode": [mode: Mode];
	"set-color": [color: string];
}>();
</script>

<template>
	<button
		v-if="!isFullscreen"
		class="fixed bottom-4 left-1/2 z-30 w-[min(92vw,280px)] -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/84 px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:bg-slate-950 xl:hidden"
		type="button"
		@click="$emit('toggle-controls')"
	>
		{{ controlsOpen ? "Hide controls" : "Show controls" }}
	</button>

	<aside
		v-if="!isFullscreen"
		class="fixed left-1/2 bottom-16 z-20 flex w-[min(92vw,560px)] -translate-x-1/2 max-h-[44svh] overflow-y-auto rounded-[1.5rem] border border-white/15 bg-slate-950/78 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition duration-200 sm:bottom-6 sm:w-[min(86vw,560px)] sm:p-4 xl:static xl:mx-0 xl:max-h-[calc(100vh-8.5rem)] xl:w-full xl:max-w-[320px] xl:translate-x-0 xl:self-start xl:bg-slate-950/84"
		:class="
			controlsOpen
				? 'opacity-100 translate-y-0 pointer-events-auto'
				: 'opacity-0 translate-y-6 pointer-events-none xl:opacity-100 xl:translate-y-0 xl:pointer-events-auto'
		"
	>
		<div class="w-full space-y-4">
			<div class="grid w-full grid-cols-2 gap-2">
				<button
					class="rounded-full border px-3 py-2 text-xs font-semibold transition duration-200 hover:-translate-y-0.5 sm:px-4 sm:text-sm"
					:class="
						isOn
							? 'border-emerald-300/40 bg-emerald-400 text-slate-950 shadow-[0_12px_32px_rgba(16,185,129,0.28)] hover:bg-emerald-300'
							: 'border-white/10 bg-white/10 text-white hover:bg-white/20'
					"
					type="button"
					:aria-pressed="isOn"
					@click="$emit('turn-on')"
				>
					On
				</button>
				<button
					class="rounded-full border px-3 py-2 text-xs font-semibold transition duration-200 hover:-translate-y-0.5 sm:px-4 sm:text-sm"
					:class="
						!isOn
							? 'border-rose-300/40 bg-rose-400 text-slate-950 shadow-[0_12px_32px_rgba(244,63,94,0.28)] hover:bg-rose-300'
							: 'border-white/10 bg-white/10 text-white hover:bg-white/20'
					"
					type="button"
					:aria-pressed="!isOn"
					@click="$emit('turn-off')"
				>
					Off
				</button>
			</div>

			<div class="flex w-full flex-col gap-2">
				<span
					class="text-center text-xs font-medium uppercase tracking-[0.28em] text-slate-400 sm:text-left"
				>
					Mode
				</span>
				<div class="grid grid-cols-3 gap-2">
					<button
						v-for="mode in modes"
						:key="mode"
						type="button"
						class="rounded-full border px-3 py-2 text-xs font-medium transition duration-200 hover:-translate-y-0.5 sm:px-4 sm:text-sm"
						:class="
							currentMode === mode
								? 'border-fuchsia-200/40 bg-fuchsia-300 text-slate-950'
								: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
						"
						@click="$emit('set-mode', mode)"
					>
						{{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
					</button>
				</div>
			</div>

			<div
				class="grid max-h-[34vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 sm:max-h-[32vh] xl:max-h-[calc(100dvh-22rem)]"
			>
				<button
					v-for="swatch in swatches"
					:key="swatch.color"
					type="button"
					class="group aspect-square min-h-[3rem] overflow-hidden rounded-xl border transition duration-200 hover:-translate-y-0.5"
					:class="
						currentColor === swatch.color
							? 'border-white/60 shadow-[0_12px_28px_rgba(0,0,0,0.45),0_0_0_3px_rgba(255,255,255,0.08)]'
							: 'border-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.24)]'
					"
					:style="{ backgroundColor: swatch.color }"
					:aria-label="`Color from ${swatch.label}`"
					@click="$emit('set-color', swatch.color)"
				>
					<span class="sr-only">{{ swatch.label }}</span>
				</button>
			</div>

			<p class="text-center text-xs leading-5 text-slate-300 sm:text-sm">
				Tip: use On, pick a color, and try Random or Blink for live concert light effects.
			</p>
		</div>
	</aside>
</template>
