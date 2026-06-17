<script setup lang="ts">
const requestUrl = useRequestURL();
const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`;
const canonicalUrl = new URL(requestUrl.pathname, siteUrl).href;
const socialImageUrl = new URL("/images/bloombilya.png", siteUrl).href;

const lightstickApp = useLightstickApp();
const {
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
	toggleControls,
} = lightstickApp;

const { enterMusicMode, enterDeviceAudioMode, exitMusicMode } = useMusicSync(lightstickApp);

useHead({
	title: "E-Bloombilya — Virtual Lightstick",
	link: [
		{
			rel: "canonical",
			href: canonicalUrl,
		},
	],
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
	ogUrl: canonicalUrl,
	ogSiteName: "E-Bloombilya",
	ogType: "website",
	ogImage: socialImageUrl,
	ogImageWidth: 1563,
	ogImageHeight: 1563,
	ogImageType: "image/png",
	twitterCard: "summary_large_image",
	twitterTitle: "E-Bloombilya — Virtual Lightstick",
	twitterDescription:
		"A BINI-inspired virtual lightstick with official lightstick styling, color swatches, and animated glow modes.",
	twitterImage: socialImageUrl,
	twitterImageAlt: "E-Bloombilya virtual lightstick",
});
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
			<LightstickHeader
				v-if="!isFullscreen"
				:can-install-app="canInstallApp"
				@install="installApp"
			/>

			<LightstickStage
				:current-color="currentColor"
				:current-face-src="currentFaceSrc"
				:glow-visible="glowVisible"
				:is-on="isOn"
				:is-fullscreen="isFullscreen"
				:fullscreen-brightness="forceMobileFullscreenBrightness()"
				:glow-style="glowStyle"
				:face-brightness-style="faceBrightnessStyle"
				:image-glow-style="imageGlowStyle"
				@toggle-fullscreen="toggleFullscreen"
				@toggle-power="isOn ? turnOff() : turnOn()"
				@stage-ready="setStageElement"
				@glow-ready="setGlowElement"
			/>

			<LightstickControls
				:controls-open="controlsOpen"
				:is-fullscreen="isFullscreen"
				:is-on="isOn"
				:current-mode="currentMode"
				:current-color="currentColor"
				:swatches="swatches"
				@toggle-controls="toggleControls"
				@turn-on="turnOn"
				@turn-off="turnOff"
				@set-mode="setMode"
				@set-color="setColor"
				@enter-device-audio-mode="enterDeviceAudioMode"
				@exit-music-mode="exitMusicMode"
			/>

			<FullscreenBrightnessBar
				v-model="fullscreenBrightness"
				:is-fullscreen="isFullscreen"
				:is-mobile-fullscreen="isMobileFullscreen"
			/>

			<FullscreenWarningDialog
				:open="showFullscreenWarning"
				@close="dismissFullscreenWarning(false)"
				@remind-later="dismissFullscreenWarning(true)"
			/>

			<LightstickFooter v-if="!isFullscreen" />
		</div>
	</main>
</template>
