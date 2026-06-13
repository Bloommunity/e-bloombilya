<script setup lang="ts">
type Mode = "fixed" | "random" | "blink";

type Swatch = {
	label: string;
	color: string;
	ready?: boolean;
};

type FaceVariant = {
	src: string;
};

type FaceVariantMap = Record<string, string>;

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void> | void;
	userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
};

const COLOR_IMAGES = [
	{ label: "AIAH", color: "#ff0000" },
	{ label: "BINI OT8", color: "#ff8b00" },
	{ label: "COLET", color: "#fff800" },
	{ label: "GWEN", color: "#00ff01" },
	{ label: "JHOANNA", color: "#55ffe3" },
	{ label: "MALOI", color: "#00c7ff" },
	{ label: "MIKHA", color: "#0000fe" },
	{ label: "SHEENA", color: "#a700fe" },
	{ label: "STACEY", color: "#ff0083" },
];

const OFFICIAL_FACE = "/images/bloombilya-768.png";
const OFFICIAL_FACE_FULL = "/images/bloombilya.png";
const FACE_VARIANTS: FaceVariant[] = [
	{ src: new URL("../assets/images/bloombilya-red.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-orange.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-yellow.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-green.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-teal.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-lightblue.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-blue.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-violet.png", import.meta.url).href },
	{ src: new URL("../assets/images/bloombilya-pink.png", import.meta.url).href },
];
const FACE_VARIANTS_BY_COLOR: FaceVariantMap = {
	"#ff0000": FACE_VARIANTS[0].src,
	"#ff8b00": FACE_VARIANTS[1].src,
	"#fff800": FACE_VARIANTS[2].src,
	"#00ff01": FACE_VARIANTS[3].src,
	"#55ffe3": FACE_VARIANTS[4].src,
	"#00c7ff": FACE_VARIANTS[5].src,
	"#0000fe": FACE_VARIANTS[6].src,
	"#a700fe": FACE_VARIANTS[7].src,
	"#ff0083": FACE_VARIANTS[8].src,
};

const lightstickRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const glowRef = ref<HTMLElement | null>(null);
const deferredInstallPrompt = ref<BeforeInstallPromptEvent | null>(null);
const canInstallApp = ref(false);

const swatches = ref<Swatch[]>(
	COLOR_IMAGES.map((item) => ({
		...item,
		ready: false,
	})),
);

const currentColor = ref("#ffffff");
const currentMode = ref<Mode>("fixed");
const isOn = ref(false);
const glowVisible = ref(false);
const isFullscreen = ref(false);
const controlsOpen = ref(true);
const currentFaceSrc = ref(OFFICIAL_FACE);

let modeInterval: ReturnType<typeof globalThis.setInterval> | null = null;
let removeTouchEndListener: (() => void) | null = null;
let removeViewportResizeListener: (() => void) | null = null;
let removeFullscreenListener: (() => void) | null = null;
let removeInstallPromptListener: (() => void) | null = null;
let removeAppInstalledListener: (() => void) | null = null;
let cleanupListeners: (() => void) | null = null;

useHead({
	title: "E-Bloombilya — Virtual Lightstick",
});

useSeoMeta({
	title: "E-Bloombilya — Virtual Lightstick",
	description:
		"E-Bloombilya is a BINI-inspired virtual lightstick app with official lightstick styling, color swatches, animated glow modes, and mobile PWA install support.",
	keywords:
		"BINI, BINI lightstick, BINI official lightstick, Bloombilya, E-Bloombilya, virtual lightstick, virtual LS, lightstick app, P-pop, BINI fan app",
	ogTitle: "E-Bloombilya — Virtual Lightstick",
	ogDescription:
		"A BINI-inspired virtual lightstick with official lightstick styling, color swatches, and animated glow modes.",
	ogType: "website",
	ogImage: "/images/bloombilya.png",
	twitterCard: "summary_large_image",
	twitterTitle: "E-Bloombilya — Virtual Lightstick",
	twitterDescription:
		"A BINI-inspired virtual lightstick with official lightstick styling, color swatches, and animated glow modes.",
	twitterImage: "/images/bloombilya.png",
});

function hexToRgba(hex: string, alpha = 1) {
	const normalized = hex.replace("#", "");
	const value = Number.parseInt(normalized, 16);
	const red = (value >> 16) & 255;
	const green = (value >> 8) & 255;
	const blue = value & 255;
	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function glowStyle(colorHex: string) {
	const centerTone = hexToRgba(colorHex, 0.18);
	const midTone = hexToRgba(colorHex, 0.82);
	const edgeTone = hexToRgba(colorHex, 0.28);

	return {
		background: `radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.18) 0%, ${midTone} 22%, ${edgeTone} 55%, transparent 70%), radial-gradient(circle at 50% 70%, ${centerTone} 0%, transparent 82%)`,
		boxShadow: `0 0 40px ${hexToRgba(colorHex, 0.4)}, 0 0 140px ${hexToRgba(colorHex, 0.18)}`,
	};
}

function imageGlowStyle(colorHex: string) {
	return {
		filter: `drop-shadow(0 0 12px ${hexToRgba(colorHex, 0.35)}) brightness(1.06) saturate(1.12)`,
	};
}

function resolveFaceSrc(colorHex: string) {
	return FACE_VARIANTS_BY_COLOR[colorHex.toLowerCase()] ?? OFFICIAL_FACE;
}

function syncFaceImage(colorHex: string) {
	currentFaceSrc.value = resolveFaceSrc(colorHex);
}

function applyGlow(colorHex: string) {
	const glowEl = glowRef.value;
	if (!glowEl) return;

	const styles = glowStyle(colorHex);
	glowEl.style.background = styles.background;
	glowEl.style.boxShadow = styles.boxShadow;
}

function syncFullscreenState() {
	isFullscreen.value = document.fullscreenElement === stageRef.value;
}

async function toggleFullscreen() {
	const stage = stageRef.value;
	if (!stage) return;

	if (isFullscreen.value && !document.fullscreenElement) {
		isFullscreen.value = false;
		return;
	}

	if (document.fullscreenElement) {
		try {
			await document.exitFullscreen();
		} catch {
			isFullscreen.value = false;
		}
		return;
	}

	if (stage.requestFullscreen) {
		try {
			await stage.requestFullscreen();
			return;
		} catch {
			// fall back to the in-app fullscreen state below
		}
	}

	isFullscreen.value = true;
}

function stopMode() {
	if (modeInterval) {
		globalThis.clearInterval(modeInterval);
		modeInterval = null;
	}
}

function setColor(colorHex: string) {
	currentColor.value = colorHex;
	if (isOn.value) {
		syncFaceImage(colorHex);
	} else {
		currentFaceSrc.value = OFFICIAL_FACE;
	}

	for (const swatch of swatches.value) {
		swatch.ready = swatch.color === colorHex;
	}

	if (isOn.value) {
		applyGlow(colorHex);
	}
}

function turnOn() {
	if (isOn.value) return;

	isOn.value = true;
	glowVisible.value = true;
	syncFaceImage(currentColor.value);
	applyGlow(currentColor.value);
	startMode();
}

function turnOff() {
	if (!isOn.value) return;

	isOn.value = false;
	glowVisible.value = false;
	currentFaceSrc.value = OFFICIAL_FACE;
	stopMode();
}

function startMode() {
	stopMode();

	if (!isOn.value) return;

	if (currentMode.value === "fixed") {
		glowVisible.value = true;
		applyGlow(currentColor.value);
		return;
	}

	if (currentMode.value === "random") {
		glowVisible.value = true;
		modeInterval = globalThis.setInterval(() => {
			const readyColors = swatches.value.filter(
				(swatch) => swatch.ready || swatch.color !== "#ffffff",
			);
			if (!readyColors.length) return;

			const chosen = readyColors[Math.floor(Math.random() * readyColors.length)];
			setColor(chosen.color);
		}, 800);
		return;
	}

	if (currentMode.value === "blink") {
		glowVisible.value = true;
		syncFaceImage(currentColor.value);

		modeInterval = globalThis.setInterval(() => {
			glowVisible.value = !glowVisible.value;
			if (glowVisible.value) {
				syncFaceImage(currentColor.value);
				applyGlow(currentColor.value);
			} else {
				currentFaceSrc.value = OFFICIAL_FACE;
			}
		}, 450);
	}
}

function setViewportHeight() {
	const height = globalThis.visualViewport?.height ?? globalThis.innerHeight;
	const vh = height * 0.01;
	document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function detectIOS() {
	const ua = navigator.userAgent || navigator.vendor;
	if (
		/iPad|iPhone|iPod/.test(ua) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
	) {
		document.documentElement.classList.add("is-ios");
	}
}

function registerServiceWorker() {
	if (!("serviceWorker" in navigator)) return;

	navigator.serviceWorker.register("/sw.js").catch(() => {});
}

function onBeforeInstallPrompt(event: Event) {
	event.preventDefault();
	deferredInstallPrompt.value = event as BeforeInstallPromptEvent;
	canInstallApp.value = true;
}

async function installApp() {
	if (!deferredInstallPrompt.value) return;

	deferredInstallPrompt.value.prompt();
	await deferredInstallPrompt.value.userChoice.catch(() => null);
	deferredInstallPrompt.value = null;
	canInstallApp.value = false;
}

onBeforeUnmount(() => {
	stopMode();
	removeTouchEndListener?.();
	removeViewportResizeListener?.();
	removeFullscreenListener?.();
	removeInstallPromptListener?.();
	removeAppInstalledListener?.();
	cleanupListeners?.();
});

onMounted(async () => {
	setViewportHeight();
	detectIOS();
	registerServiceWorker();
	globalThis.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
	removeInstallPromptListener = () => {
		globalThis.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
	};

	const onAppInstalled = () => {
		deferredInstallPrompt.value = null;
		canInstallApp.value = false;
	};
	globalThis.addEventListener("appinstalled", onAppInstalled);
	removeAppInstalledListener = () => {
		globalThis.removeEventListener("appinstalled", onAppInstalled);
	};

	const onResize = () => setViewportHeight();
	const onVisibilityChange = () => {
		if (document.hidden) {
			stopMode();
			return;
		}

		if (isOn.value) {
			startMode();
		}
	};

	globalThis.addEventListener("resize", onResize);
	globalThis.addEventListener("orientationchange", onResize);
	globalThis.addEventListener("pageshow", onResize);
	document.addEventListener("visibilitychange", onVisibilityChange);

	if (globalThis.visualViewport) {
		globalThis.visualViewport.addEventListener("resize", onResize);
		removeViewportResizeListener = () => {
			globalThis.visualViewport?.removeEventListener("resize", onResize);
		};
	}

	const onFullscreenChange = () => syncFullscreenState();
	document.addEventListener("fullscreenchange", onFullscreenChange);
	removeFullscreenListener = () => {
		document.removeEventListener("fullscreenchange", onFullscreenChange);
	};
	syncFullscreenState();

	const onTouchEnd = () => globalThis.setTimeout(setViewportHeight, 50);
	globalThis.addEventListener("touchend", onTouchEnd);
	removeTouchEndListener = () => {
		globalThis.removeEventListener("touchend", onTouchEnd);
	};
	cleanupListeners = () => {
		globalThis.removeEventListener("resize", onResize);
		globalThis.removeEventListener("orientationchange", onResize);
		globalThis.removeEventListener("pageshow", onResize);
		document.removeEventListener("visibilitychange", onVisibilityChange);
	};
});

watch(currentMode, () => {
	if (isOn.value) {
		startMode();
	}
});

watch(isOn, (value) => {
	if (value) {
		startMode();
	}
});

setColor(currentColor.value);
</script>

<template>
	<main
		class="isolate fixed inset-0 overflow-hidden bg-[#050816] text-slate-100"
		:class="isFullscreen ? '!bg-black' : ''"
	>
		<div class="scene-glow scene-glow-a" />
		<div class="scene-glow scene-glow-b" />

		<div
			class="relative z-10 mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] grid-cols-1 gap-4 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] xl:grid-rows-[auto_minmax(0,1fr)] xl:items-start xl:gap-6"
			:class="isFullscreen ? '!max-w-none !px-0 !py-0' : ''"
		>
			<header
				v-if="!isFullscreen"
				class="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:flex-row sm:items-center sm:justify-between sm:p-5 xl:col-span-2"
			>
				<div class="space-y-2">
					<p class="text-[0.62rem] uppercase tracking-[0.5em] text-amber-200/70">
						Virtual Lightstick
					</p>
					<h1
						class="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
					>
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
						@click="installApp()"
					>
						Install app
					</button>
				</div>
			</header>

			<button
				v-if="!isFullscreen"
				class="fixed bottom-4 left-1/2 z-30 w-[min(92vw,280px)] -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/84 px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:bg-slate-950 xl:hidden"
				type="button"
				@click="controlsOpen = !controlsOpen"
			>
				{{ controlsOpen ? "Hide controls" : "Show controls" }}
			</button>

			<section
				ref="stageRef"
				class="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/48 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6 xl:min-w-0"
				:class="
					isFullscreen
						? '!fixed !inset-0 !z-50 !rounded-none !border-0 !bg-black !p-0 !shadow-none'
						: ''
				"
			>
				<div
					class="pointer-events-none absolute left-1/2 top-1/2 z-0 rounded-full transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform]"
					:class="[
						glowVisible ? 'scale-100 opacity-100' : 'scale-[0.94] opacity-0',
						isFullscreen
							? '!h-[140vmax] !w-[140vmax] -translate-x-1/2 -translate-y-1/2 !blur-[120px]'
							: 'h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 sm:h-[64vmin] sm:w-[64vmin] xl:h-[52rem] xl:w-[52rem]',
					]"
					:style="glowStyle(currentColor)"
					aria-hidden="true"
				/>

				<button
					class="absolute right-4 top-4 z-40 rounded-full border border-white/15 bg-slate-950/84 px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_36px_rgba(0,0,0,0.35)] transition hover:bg-slate-950"
					type="button"
					@click="toggleFullscreen()"
				>
					{{ isFullscreen ? "Exit fullscreen" : "Fullscreen" }}
				</button>

				<div
					ref="lightstickRef"
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
							@click="isOn ? turnOff() : turnOn()"
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
							@click="turnOn()"
							:aria-pressed="isOn"
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
							@click="turnOff()"
							:aria-pressed="!isOn"
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
								v-for="mode in ['fixed', 'random', 'blink']"
								:key="mode"
								type="button"
								class="rounded-full border px-3 py-2 text-xs font-medium transition duration-200 hover:-translate-y-0.5 sm:px-4 sm:text-sm"
								:class="
									currentMode === mode
										? 'border-fuchsia-200/40 bg-fuchsia-300 text-slate-950'
										: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
								"
								@click="currentMode = mode as Mode"
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
							@click="setColor(swatch.color)"
						>
							<span class="sr-only">{{ swatch.label }}</span>
						</button>
					</div>

					<p class="text-center text-xs leading-5 text-slate-300 sm:text-sm">
						Tip: use On, pick a color, and try Random or Blink for live concert light
						effects.
					</p>
				</div>
			</aside>

			<footer
				v-if="!isFullscreen"
				class="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-4 pb-2 sm:px-6 sm:pb-4"
			>
				<div class="mx-auto max-w-7xl">
					<p class="pointer-events-auto text-center text-[0.7rem] uppercase tracking-[0.35em] text-slate-300/70">
						Made by Blooms for Blooms
					</p>
				</div>
			</footer>
		</div>
	</main>
</template>
