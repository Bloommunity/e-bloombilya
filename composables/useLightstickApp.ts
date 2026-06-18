type Mode = "fixed" | "random" | "blink" | "control" | "music";

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
const MOBILE_FULLSCREEN_WARNING_KEY = "ebloombilya-fullscreen-warning-snooze-until";
const MOBILE_FULLSCREEN_WARNING_SNOOZE_MS = 24 * 60 * 60 * 1000;
const FORCED_FULLSCREEN_BRIGHTNESS = 1.24;
const MOBILE_FULLSCREEN_QUERY = "(max-width: 768px), (pointer: coarse)";

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

export function useLightstickApp() {
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
	const fullscreenBrightness = ref(1);
	const isMobileFullscreen = ref(false);
	const showFullscreenWarning = ref(false);
	const controlsOpen = ref(true);
	const currentFaceSrc = ref(OFFICIAL_FACE);

	let modeInterval: ReturnType<typeof globalThis.setInterval> | null = null;
	let removeTouchEndListener: (() => void) | null = null;
	let removeViewportResizeListener: (() => void) | null = null;
	let removeFullscreenListener: (() => void) | null = null;
	let removeInstallPromptListener: (() => void) | null = null;
	let removeAppInstalledListener: (() => void) | null = null;
	let cleanupListeners: (() => void) | null = null;

	function hexToRgba(hex: string, alpha = 1) {
		const normalized = hex.replace("#", "");
		const value = Number.parseInt(normalized, 16);
		const red = (value >> 16) & 255;
		const green = (value >> 8) & 255;
		const blue = value & 255;
		return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function glowStyle(colorHex: string, brightnessScale = 1) {
		const glowScale = clamp(brightnessScale, 0.7, 1.6);
		const centerTone = hexToRgba(colorHex, clamp(0.18 * glowScale, 0.12, 0.34));
		const midTone = hexToRgba(colorHex, clamp(0.82 * glowScale, 0.45, 1));
		const edgeTone = hexToRgba(colorHex, clamp(0.28 * glowScale, 0.16, 0.42));

		return {
			background: `radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.18) 0%, ${midTone} 22%, ${edgeTone} 55%, transparent 70%), radial-gradient(circle at 50% 70%, ${centerTone} 0%, transparent 82%)`,
			boxShadow: `0 0 40px ${hexToRgba(colorHex, clamp(0.4 * glowScale, 0.28, 0.68))}, 0 0 140px ${hexToRgba(colorHex, clamp(0.18 * glowScale, 0.12, 0.34))}`,
		};
	}

	function faceBrightnessStyle(brightnessScale: number) {
		return {
			"--tw-brightness": `brightness(${brightnessScale})`,
		} as Record<string, string>;
	}

	function getFullscreenWarningSnoozeUntil() {
		const storedValue = globalThis.localStorage?.getItem(MOBILE_FULLSCREEN_WARNING_KEY);
		if (!storedValue) return 0;

		const parsedValue = Number.parseInt(storedValue, 10);
		if (!Number.isFinite(parsedValue)) {
			globalThis.localStorage?.removeItem(MOBILE_FULLSCREEN_WARNING_KEY);
			return 0;
		}

		return parsedValue;
	}

	function isFullscreenWarningSnoozed() {
		return Date.now() < getFullscreenWarningSnoozeUntil();
	}

	function forceMobileFullscreenBrightness() {
		return isMobileFullscreen.value ? FORCED_FULLSCREEN_BRIGHTNESS : fullscreenBrightness.value;
	}

	function syncFullscreenWarningState() {
		if (!isMobileFullscreen.value || isFullscreenWarningSnoozed()) {
			showFullscreenWarning.value = false;
			return;
		}

		showFullscreenWarning.value = true;
	}

	function dismissFullscreenWarning(remindLater = false) {
		if (remindLater) {
			globalThis.localStorage?.setItem(
				MOBILE_FULLSCREEN_WARNING_KEY,
				String(Date.now() + MOBILE_FULLSCREEN_WARNING_SNOOZE_MS),
			);
		}

		showFullscreenWarning.value = false;
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

	function setStageElement(element: HTMLElement | null) {
		stageRef.value = element;
		syncFullscreenState();
	}

	function setGlowElement(element: HTMLElement | null) {
		glowRef.value = element;
		if (element && isOn.value) {
			applyGlow(currentColor.value);
		}
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

		if (currentMode.value === "music") {
			glowVisible.value = true;
			syncFaceImage(currentColor.value);
			applyGlow(currentColor.value);
			// Music sync is handled by useMusicSync composable
		}
	}

	function setMode(mode: Mode) {
		currentMode.value = mode;
	}

	function toggleControls() {
		controlsOpen.value = !controlsOpen.value;
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

	function syncMobileFullscreenState() {
		isMobileFullscreen.value = globalThis.matchMedia(MOBILE_FULLSCREEN_QUERY).matches;
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
		syncMobileFullscreenState();
		syncFullscreenWarningState();
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
		const onDeviceChange = () => {
			syncMobileFullscreenState();
			syncFullscreenWarningState();
		};
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
		globalThis.addEventListener("resize", onDeviceChange);
		globalThis.addEventListener("orientationchange", onDeviceChange);
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
			globalThis.removeEventListener("resize", onDeviceChange);
			globalThis.removeEventListener("orientationchange", onDeviceChange);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	});

	watch(isFullscreen, (value) => {
		if (!value && !isMobileFullscreen.value) {
			showFullscreenWarning.value = false;
		}
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

	return {
		stageRef,
		glowRef,
		canInstallApp,
		swatches,
		currentColor,
		currentMode,
		setMode,
		isOn,
		glowVisible,
		isFullscreen,
		fullscreenBrightness,
		isMobileFullscreen,
		showFullscreenWarning,
		controlsOpen,
		currentFaceSrc,
		toggleControls,
		glowStyle,
		faceBrightnessStyle,
		imageGlowStyle,
		setStageElement,
		setGlowElement,
		forceMobileFullscreenBrightness,
		dismissFullscreenWarning,
		setColor,
		turnOn,
		turnOff,
		toggleFullscreen,
		installApp,
	};
}
