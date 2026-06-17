/**
 * Audio Analysis Composable
 * Analyzes audio data and detects beats for light synchronization
 * Supports both HTMLMediaElement (MP3 files) and MediaStream (device audio)
 */

export interface AudioAnalysis {
	frequency: number; // 0-1 normalized
	bass: number; // 0-1 low frequency energy
	mid: number; // 0-1 mid frequency energy
	treble: number; // 0-1 high frequency energy
	energy: number; // 0-1 overall energy
	isBeat: boolean;
}

export function useAudioAnalyzer() {
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let source: AudioNode | null = null;
	let mediaElement: HTMLMediaElement | null = null;
	let mediaStream: MediaStream | null = null;
	const analysisData = ref<AudioAnalysis>({
		frequency: 0,
		bass: 0,
		mid: 0,
		treble: 0,
		energy: 0,
		isBeat: false,
	});

	let dataArray: Uint8Array | null = null;
	let lastBeatTime = 0;
	let beatThreshold = 0.4;
	let noiseGateThreshold = 0.08; // Minimum energy to react to (higher = more noise filtering)
	let bassHistory: number[] = [];
	const HISTORY_SIZE = 30;
	let animationFrameId: number | null = null;

	function initializeAnalyzer(input: HTMLMediaElement | MediaStream) {
		try {
			if (!audioContext) {
				audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			}

			if (audioContext.state === "suspended") {
				audioContext.resume();
			}

			if (!analyser) {
				analyser = audioContext.createAnalyser();
				analyser.fftSize = 256;
			}

			// Disconnect previous source if exists
			if (source) {
				source.disconnect();
				source = null;
			}

			// Handle different input types
			if (input instanceof MediaStream) {
				mediaStream = input;
				mediaElement = null;
				source = audioContext.createMediaStreamSource(input);
				// For microphone: only connect to analyser, NOT to speakers
				source.connect(analyser);
			} else {
				mediaElement = input;
				mediaStream = null;
				source = audioContext.createMediaElementSource(input);
				// For audio element: connect through analyser to speakers
				source.connect(analyser);
				analyser.connect(audioContext.destination);
			}

			dataArray = new Uint8Array(analyser.frequencyBinCount);
			bassHistory = [];

			return true;
		} catch (err) {
			console.error("Failed to initialize audio analyzer:", err);
			return false;
		}
	}

	function analyzeFrame(): AudioAnalysis {
		if (!analyser || !dataArray) {
			return analysisData.value;
		}

		analyser.getByteFrequencyData(dataArray as any);

		const bass = getFrequencyRange(dataArray, 0, 0.1) / 255;
		const mid = getFrequencyRange(dataArray, 0.1, 0.5) / 255;
		const treble = getFrequencyRange(dataArray, 0.5, 1) / 255;
		const frequency = Math.max(bass, mid, treble);
		const energy = (bass + mid + treble) / 3;

		// Apply noise gate - ignore very quiet audio (ambient noise)
		if (energy < noiseGateThreshold) {
			bassHistory = [];
			analysisData.value = {
				frequency: 0,
				bass: 0,
				mid: 0,
				treble: 0,
				energy: 0,
				isBeat: false,
			};
			return analysisData.value;
		}

		bassHistory.push(bass);
		if (bassHistory.length > HISTORY_SIZE) {
			bassHistory.shift();
		}

		const averageBass = bassHistory.reduce((a, b) => a + b, 0) / bassHistory.length;
		const isBeat = bass > averageBass * 1.3 && Date.now() - lastBeatTime > 200;

		if (isBeat) {
			lastBeatTime = Date.now();
			console.log(
				"[useAudioAnalyzer] BEAT! Bass:",
				bass.toFixed(2),
				"AvgBass:",
				averageBass.toFixed(2),
			);
		}

		analysisData.value = {
			frequency,
			bass,
			mid,
			treble,
			energy,
			isBeat,
		};

		return analysisData.value;
	}

	function getFrequencyRange(
		dataArray: Uint8Array,
		startPercent: number,
		endPercent: number,
	): number {
		const start = Math.floor(dataArray.length * startPercent);
		const end = Math.max(start + 1, Math.floor(dataArray.length * endPercent));
		let sum = 0;

		for (let i = start; i < end; i++) {
			sum += dataArray[i];
		}

		return sum / (end - start);
	}

	function setThreshold(value: number) {
		beatThreshold = Math.max(0, Math.min(1, value));
	}

	function setNoiseGate(value: number) {
		noiseGateThreshold = Math.max(0, Math.min(0.1, value));
	}

	function startAnalysis(callback?: (analysis: AudioAnalysis) => void) {
		if (animationFrameId !== null) return;

		const frame = () => {
			analyzeFrame();
			if (callback) {
				callback(analysisData.value);
			}
			animationFrameId = requestAnimationFrame(frame);
		};

		animationFrameId = requestAnimationFrame(frame);
	}

	function stopAnalysis() {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	function dispose() {
		stopAnalysis();
		stopMediaStream();
		if (analyser) {
			analyser.disconnect();
		}
		if (source) {
			source.disconnect();
		}
	}

	function stopMediaStream() {
		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null;
		}
	}

	onUnmounted(() => {
		dispose();
	});

	return {
		analysisData,
		initializeAnalyzer,
		analyzeFrame,
		startAnalysis,
		stopAnalysis,
		setThreshold,
		setNoiseGate,
		dispose,
	};
}
