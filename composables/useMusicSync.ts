/**
 * Music Sync Composable
 * Orchestrates audio analysis with lightstick lighting effects
 * Supports both MP3 playback and device audio input (microphone)
 */

import type { AudioAnalysis } from "./useAudioAnalyzer";
import { useAudioAnalyzer } from "./useAudioAnalyzer";
import { useLightstickApp } from "./useLightstickApp";

type SyncMode = "beat" | "energy" | "rainbow";

export function useMusicSync(lightstickApp: ReturnType<typeof useLightstickApp>) {
	const { analysisData, initializeAnalyzer, startAnalysis, stopAnalysis, dispose, setNoiseGate } =
		useAudioAnalyzer();

	const isMusicMode = ref(false);
	const isPlaying = ref(false);
	const audioElement = ref<HTMLAudioElement | null>(null);
	const mediaStream = ref<MediaStream | null>(null);
	const isUsingDeviceAudio = ref(false);
	const syncMode = ref<SyncMode>("beat");
	const beatSensitivity = ref(0.6);

	// Color mapping based on beat/energy
	const beatColors = [
		"#ff0000", // Red (AIAH)
		"#ff8b00", // Orange
		"#fff800", // Yellow
		"#00ff01", // Green
		"#55ffe3", // Teal
		"#00c7ff", // Light Blue
		"#0000fe", // Blue
		"#a700fe", // Violet
		"#ff0083", // Pink
	];

	// Enter music mode with MP3 audio
	function enterMusicMode(audio: HTMLAudioElement) {
		console.log("[useMusicSync] Entering music mode with audio file");
		isMusicMode.value = true;
		isUsingDeviceAudio.value = false;
		audioElement.value = audio;
		mediaStream.value = null;
		lightstickApp.turnOn();
		lightstickApp.setMode("music" as any);

		// Initialize audio analyzer
		const initialized = initializeAnalyzer(audio);
		console.log("[useMusicSync] Audio analyzer initialized:", initialized);
		if (initialized) {
			startAnalysis((analysis: AudioAnalysis) => {
				console.log("[useMusicSync] Analysis data:", analysis);
				syncLights(analysis);
			});
		} else {
			console.error("[useMusicSync] Failed to initialize audio analyzer");
		}
	}

	// Enter music mode with device audio (microphone)
	async function enterDeviceAudioMode() {
		console.log("[useMusicSync] Requesting microphone access...");
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: false,
					noiseSuppression: true, // Enable browser noise suppression
					autoGainControl: false,
				},
			});

			console.log("[useMusicSync] Microphone access granted");
			isMusicMode.value = true;
			isUsingDeviceAudio.value = true;
			mediaStream.value = stream;
			audioElement.value = null;
			lightstickApp.turnOn();
			lightstickApp.setMode("music" as any);

			// Initialize audio analyzer with media stream
			const initialized = initializeAnalyzer(stream);
			console.log("[useMusicSync] Audio analyzer initialized for device audio:", initialized);
			if (initialized) {
				startAnalysis((analysis: AudioAnalysis) => {
					console.log("[useMusicSync] Device audio analysis:", analysis);
					syncLights(analysis);
				});
			} else {
				console.error(
					"[useMusicSync] Failed to initialize audio analyzer for device audio",
				);
				stopDeviceAudioMode();
			}
		} catch (error) {
			console.error("[useMusicSync] Microphone access denied or error:", error);
			throw error;
		}
	}

	// Exit music mode
	function exitMusicMode() {
		console.log("[useMusicSync] Exiting music mode");
		isMusicMode.value = false;
		isPlaying.value = false;
		stopAnalysis();
		dispose();

		// Restore previous mode or turn off
		lightstickApp.setMode("fixed");
	}

	// Exit device audio mode
	function stopDeviceAudioMode() {
		if (mediaStream.value) {
			mediaStream.value.getTracks().forEach((track) => track.stop());
			mediaStream.value = null;
		}
		isUsingDeviceAudio.value = false;
		exitMusicMode();
	}

	// Sync lights based on audio analysis
	function syncLights(analysis: AudioAnalysis) {
		if (!isMusicMode.value) return;

		// Always use energy-based sync as a fallback - this should always change color
		syncByEnergy(analysis);
	}

	// Sync by bass beats
	function syncByBeat(analysis: AudioAnalysis) {
		if (analysis.isBeat) {
			// Flash on beat
			const colorIndex = Math.floor(Math.random() * beatColors.length);
			const color = beatColors[colorIndex];
			console.log(
				"[useMusicSync] Beat detected! Energy:",
				analysis.energy,
				"Setting color:",
				color,
			);
			lightstickApp.setColor(color);

			// Restore to previous color after beat
			setTimeout(() => {
				if (isMusicMode.value) {
					lightstickApp.setColor(beatColors[0]); // Or store previous color
				}
			}, 100);
		}
	}

	// Sync by energy intensity
	function syncByEnergy(analysis: AudioAnalysis) {
		const energy = analysis.energy;
		// Map energy (0-1) across all 9 colors
		let colorIndex = Math.floor(energy * beatColors.length);
		colorIndex = Math.min(colorIndex, beatColors.length - 1);
		const color = beatColors[colorIndex];

		console.log(
			"[useMusicSync] Energy:",
			energy.toFixed(2),
			"Color index:",
			colorIndex,
			"Color:",
			color,
		);
		lightstickApp.setColor(color);
	}

	// Rainbow cycle based on frequency
	function syncByRainbow(analysis: AudioAnalysis) {
		const colorIndex = Math.floor(analysis.frequency * (beatColors.length - 1));
		lightstickApp.setColor(beatColors[colorIndex]);
	}

	// Toggle sync mode
	function toggleSyncMode() {
		const modes: Array<"beat" | "energy" | "rainbow"> = ["beat", "energy", "rainbow"];
		const currentIndex = modes.indexOf(syncMode.value);
		const nextIndex = (currentIndex + 1) % modes.length;
		syncMode.value = modes[nextIndex];
	}

	// Set sync mode
	function setSyncMode(mode: "beat" | "energy" | "rainbow") {
		syncMode.value = mode;
	}

	return {
		isMusicMode,
		isPlaying,
		audioElement,
		mediaStream,
		isUsingDeviceAudio,
		syncMode,
		beatSensitivity,
		analysisData,
		enterMusicMode,
		enterDeviceAudioMode,
		exitMusicMode,
		stopDeviceAudioMode,
		toggleSyncMode,
		setSyncMode,
	};
}
