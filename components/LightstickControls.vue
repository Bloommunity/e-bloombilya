<script setup lang="ts">
type Mode = "fixed" | "random" | "blink" | "control";

type Swatch = {
	label: string;
	color: string;
	ready?: boolean;
};

const modes: Mode[] = ["fixed", "random", "blink", "control"];

const modeLabels: Record<Mode, string> = {
	fixed: "Fixed",
	random: "Random",
	blink: "Blink",
	control: "Control",
};

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
		class="fixed left-1/2 bottom-16 z-20 flex w-[min(92vw,560px)] -translate-x-1/2 max-h-[44svh] overflow-y-auto rounded-[1.75rem] border border-white/15 bg-slate-950/78 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition duration-200 sm:bottom-6 sm:w-[min(86vw,560px)] sm:p-4 xl:static xl:mx-0 xl:max-h-[calc(100vh-8.5rem)] xl:w-full xl:max-w-[392px] xl:translate-x-0 xl:self-start xl:bg-slate-950/84"
		:class="
			controlsOpen
				? 'opacity-100 translate-y-0 pointer-events-auto'
				: 'opacity-0 translate-y-6 pointer-events-none xl:opacity-100 xl:translate-y-0 xl:pointer-events-auto'
		"
	>
		<div class="w-full space-y-3">
			<section
				class="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-2"
			>
				<button
					class="rounded-full border px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 sm:text-base"
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
					class="rounded-full border px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 sm:text-base"
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
			</section>

			<section class="rounded-2xl border border-white/10 bg-slate-900/55 p-3">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
						Mode
					</span>
					<span class="text-[11px] font-medium text-slate-500"
						>Pick a lighting behavior</span
					>
				</div>
				<div
					class="mt-3 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(92px,1fr))]"
				>
					<span
						v-for="mode in modes"
						:key="mode"
						:title="mode === 'control' ? 'Feature In Progress' : undefined"
						class="block"
					>
						<button
							type="button"
							:disabled="mode === 'control'"
							:aria-disabled="mode === 'control'"
							class="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl border px-3 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-100"
							:class="
								mode === 'control'
									? 'border-white/10 bg-white/5 text-slate-500 hover:translate-y-0 hover:bg-white/5 hover:text-slate-500'
									: currentMode === mode
										? 'border-fuchsia-200/40 bg-fuchsia-300 text-slate-950 shadow-[0_12px_30px_rgba(217,70,239,0.24)]'
										: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
							"
							@click="mode !== 'control' && $emit('set-mode', mode)"
						>
							{{ modeLabels[mode] }}
						</button>
					</span>
				</div>
			</section>

			<section class="rounded-2xl border border-white/10 bg-slate-900/55 p-3">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
						Colors
					</span>
					<span class="text-[11px] font-medium text-slate-500">Tap any swatch</span>
				</div>
				<div class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
					<button
						v-for="swatch in swatches"
						:key="swatch.color"
						type="button"
						class="group aspect-square min-h-[3.25rem] overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-0.5"
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
			</section>

			<p class="text-center text-xs leading-5 text-slate-300 sm:text-sm">
				Tip: use On, pick a color, and try Random or Blink for live concert light effects.
			</p>
		</div>
	</aside>
</template>
