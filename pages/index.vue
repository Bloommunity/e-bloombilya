<script setup lang="ts">
import gsap from "gsap";

type Mode = "fixed" | "random" | "blink";

type Swatch = {
	src: string;
	label: string;
	color: string;
	ready: boolean;
};

const COLOR_IMAGES = [
	{ src: "/images/colors/AIAH.png", label: "AIAH" },
	{ src: "/images/colors/BINI OT8.png", label: "BINI OT8" },
	{ src: "/images/colors/COLET.png", label: "COLET" },
	{ src: "/images/colors/GWEN.png", label: "GWEN" },
	{ src: "/images/colors/JHOANNA.png", label: "JHOANNA" },
	{ src: "/images/colors/MALOI.png", label: "MALOI" },
	{ src: "/images/colors/MIKHA.png", label: "MIKHA" },
	{ src: "/images/colors/SHEENA.png", label: "SHEENA" },
	{ src: "/images/colors/STACEY.png", label: "STACEY" },
];

const OFFICIAL_FACE = "/images/bloombilya.png";

const lightstickRef = ref<HTMLElement | null>(null);
const glowRef = ref<HTMLElement | null>(null);

const swatches = ref<Swatch[]>(
	COLOR_IMAGES.map((item) => ({
		...item,
		color: "#ffffff",
		ready: false,
	})),
);

const currentColor = ref("#ffffff");
const currentMode = ref<Mode>("fixed");
const isOn = ref(false);
const glowVisible = ref(false);
const controlsOpen = ref(true);

let modeInterval: ReturnType<typeof globalThis.setInterval> | null = null;
let removeTouchEndListener: (() => void) | null = null;
let removeViewportResizeListener: (() => void) | null = null;
let cleanupListeners: (() => void) | null = null;

useHead({
	title: "E-Bloombilya — Virtual Lightstick",
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
	const softCenter = "rgba(255,255,255,0.22)";
	const midTone = hexToRgba(colorHex, 0.9);
	const edgeTone = hexToRgba(colorHex, 0.32);

	return {
		background: `radial-gradient(circle at 50% 30%, ${softCenter} 0%, ${midTone} 22%, ${edgeTone} 52%, transparent 70%)`,
		boxShadow: `0 0 44px ${hexToRgba(colorHex, 0.45)}, 0 0 160px ${hexToRgba(colorHex, 0.2)}`,
	};
}

function applyGlow(colorHex: string) {
	const glowEl = glowRef.value;
	if (!glowEl) return;

	const styles = glowStyle(colorHex);
	glowEl.style.background = styles.background;
	glowEl.style.boxShadow = styles.boxShadow;
}

function setGlowState(visible: boolean) {
	const glowEl = glowRef.value;
	if (!glowEl) return;

	gsap.killTweensOf(glowEl);
	gsap.to(glowEl, {
		opacity: visible ? 1 : 0,
		scale: visible ? 1.03 : 0.94,
		duration: visible ? 0.18 : 0.14,
		ease: "power2.out",
		overwrite: "auto",
	});
}

function stopMode() {
	if (modeInterval) {
		globalThis.clearInterval(modeInterval);
		modeInterval = null;
	}
}

function setColor(colorHex: string) {
	currentColor.value = colorHex;

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
	applyGlow(currentColor.value);
	setGlowState(true);
	startMode();
}

function turnOff() {
	if (!isOn.value) return;

	isOn.value = false;
	glowVisible.value = false;
	stopMode();
	setGlowState(false);
}

function startMode() {
	stopMode();

	if (!isOn.value) return;

	if (currentMode.value === "fixed") {
		applyGlow(currentColor.value);
		setGlowState(true);
		return;
	}

	if (currentMode.value === "random") {
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
		setGlowState(true);

		modeInterval = globalThis.setInterval(() => {
			glowVisible.value = !glowVisible.value;
			if (glowVisible.value) applyGlow(currentColor.value);
			setGlowState(glowVisible.value);
		}, 450);
	}
}

async function imageToHex(image: HTMLImageElement, size = 32) {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;

	const context = canvas.getContext("2d");
	if (!context) return "#ffffff";

	context.clearRect(0, 0, size, size);
	context.drawImage(image, 0, 0, size, size);

	try {
		const data = context.getImageData(0, 0, size, size).data;
		let red = 0;
		let green = 0;
		let blue = 0;
		let count = 0;

		for (let index = 0; index < data.length; index += 4) {
			if (data[index + 3] === 0) continue;
			red += data[index];
			green += data[index + 1];
			blue += data[index + 2];
			count += 1;
		}

		if (!count) return "#ffffff";

		red = Math.round(red / count);
		green = Math.round(green / count);
		blue = Math.round(blue / count);

		return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
	} catch {
		return "#ffffff";
	}
}

async function buildSwatches() {
	const loaded = await Promise.all(
		COLOR_IMAGES.map(async (item) => {
			try {
				const image = new Image();
				image.src = item.src;
				await new Promise<void>((resolve, reject) => {
					image.onload = () => resolve();
					image.onerror = () => reject(new Error(`Failed to load ${item.src}`));
				});

				return {
					...item,
					color: await imageToHex(image, 24),
					ready: true,
				};
			} catch {
				return {
					...item,
					color: "#ffffff",
					ready: true,
				};
			}
		}),
	);

	swatches.value = loaded;

	await nextTick();

	if (lightstickRef.value) {
		gsap.fromTo(
			lightstickRef.value.querySelectorAll("[data-animate]"),
			{ y: 18, opacity: 0 },
			{ y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" },
		);
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

onBeforeUnmount(() => {
	stopMode();
	removeTouchEndListener?.();
	removeViewportResizeListener?.();
	cleanupListeners?.();
});

onMounted(async () => {
	setViewportHeight();
	detectIOS();
	registerServiceWorker();
	await buildSwatches();

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
	<main class="isolate fixed inset-0 overflow-hidden bg-[#050816] text-slate-100">
		<div class="scene-glow scene-glow-a" />
		<div class="scene-glow scene-glow-b" />

		<div
			class="relative z-10 mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] grid-cols-1 gap-4 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:px-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,400px)] xl:grid-rows-[auto_minmax(0,1fr)] xl:items-start xl:gap-6"
		>
			<header
				class="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5 xl:col-span-2"
				data-animate
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
					class="max-w-xl rounded-full border border-white/10 bg-slate-950/35 px-4 py-3 text-sm leading-6 text-slate-300 sm:text-right"
				>
					Tap on, pick a color, then switch modes.
				</div>
			</header>

			<button
				class="fixed bottom-4 right-4 z-30 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:bg-slate-950/85 xl:hidden"
				type="button"
				@click="controlsOpen = !controlsOpen"
			>
				{{ controlsOpen ? "Hide controls" : "Show controls" }}
			</button>

			<section
				class="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6 xl:min-w-0"
			>
				<div ref="lightstickRef" class="relative flex w-full items-center justify-center">
					<div
						class="relative flex aspect-square w-[min(72vmin,540px)] items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_40px_160px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:w-[min(64vmin,620px)] sm:rounded-[2.5rem] lg:w-[min(54vmin,680px)] xl:w-[min(100%,720px)]"
					>
						<div
							class="face-mask relative flex h-[86%] w-[86%] items-center justify-center overflow-hidden rounded-full"
						>
							<div
								ref="glowRef"
								class="pointer-events-none absolute left-1/2 top-[1%] z-20 h-[58%] w-[58%] -translate-x-1/2 rounded-full mix-blend-screen transition-opacity duration-300 sm:top-0 sm:h-[52%] sm:w-[52%] lg:h-[48%] lg:w-[48%]"
								:class="glowVisible ? 'opacity-100' : 'opacity-0'"
								:style="glowStyle(currentColor)"
								aria-hidden="true"
							/>

							<img
								class="relative z-10 h-full w-full select-none object-cover opacity-90 mix-blend-hard-light transition duration-200"
								:class="
									isOn
										? ''
										: 'grayscale-[65%] brightness-75 opacity-70 mix-blend-normal'
								"
								:src="OFFICIAL_FACE"
								alt="BINI bloombilya lightstick"
							/>

							<button
								class="absolute left-1/2 top-[53%] z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-100/50 bg-[radial-gradient(circle_at_30%_28%,#fff6c6,#ffd24d)] text-amber-300 shadow-[0_10px_30px_rgba(255,180,50,0.18),0_0_28px_rgba(255,200,60,0.12)] transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20 sm:h-12 sm:w-12"
								type="button"
								aria-label="Toggle power"
								title="Toggle power"
								@click="isOn ? turnOff() : turnOn()"
							>
								<span class="text-lg leading-none text-amber-300">★</span>
							</button>
						</div>
					</div>
				</div>
			</section>

			<aside
				data-animate
				class="z-20 mx-auto max-h-[34svh] w-[calc(100vw-1.5rem)] max-w-[560px] overflow-y-auto rounded-[1.5rem] border border-white/15 bg-slate-950/45 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition duration-200 sm:w-[calc(100vw-2.5rem)] sm:p-5 xl:mx-0 xl:max-h-[calc(100vh-2rem)] xl:w-full xl:max-w-none xl:bg-slate-950/60"
				:class="
					controlsOpen
						? 'opacity-100 translate-y-0 pointer-events-auto'
						: 'opacity-0 translate-y-6 pointer-events-none xl:opacity-100 xl:translate-y-0 xl:pointer-events-auto'
				"
			>
				<div class="mb-4 flex items-center justify-center gap-3 sm:justify-start">
					<button
						class="rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5"
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
						class="rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5"
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

				<div
					class="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start"
				>
					<span class="text-slate-400">Mode:</span>
					<button
						v-for="mode in ['fixed', 'random', 'blink']"
						:key="mode"
						type="button"
						class="rounded-full border px-4 py-2 font-medium transition duration-200 hover:-translate-y-0.5"
						:class="
							currentMode === mode
								? 'border-fuchsia-400/30 bg-fuchsia-500 text-white'
								: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
						"
						@click="currentMode = mode as Mode"
					>
						{{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
					</button>
				</div>

				<div
					class="grid max-h-[38vh] grid-cols-[repeat(auto-fit,minmax(3.75rem,1fr))] gap-2 overflow-y-auto sm:max-h-[32vh] xl:max-h-[calc(100dvh-22rem)]"
				>
					<button
						v-for="swatch in swatches"
						:key="swatch.src"
						type="button"
						class="group aspect-square min-h-[3.5rem] overflow-hidden rounded-xl border transition duration-200 hover:-translate-y-0.5"
						:class="
							currentColor === swatch.color
								? 'border-white/60 shadow-[0_12px_28px_rgba(0,0,0,0.45),0_0_0_3px_rgba(255,255,255,0.08)]'
								: 'border-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.24)]'
						"
						:style="{ background: swatch.color }"
						:aria-label="`Color from ${swatch.label}`"
						@click="setColor(swatch.color)"
					>
						<img
							:src="swatch.src"
							alt=""
							class="h-full w-full object-cover opacity-85"
						/>
					</button>
				</div>

				<p class="mt-4 text-center text-xs leading-5 text-slate-300 sm:text-sm">
					Tip: use On, pick a color, and try Random or Blink for live concert light
					effects.
				</p>
			</aside>
		</div>
	</main>
</template>
