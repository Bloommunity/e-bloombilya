document.addEventListener("DOMContentLoaded", () => {
	const COLOR_SWATCHES = [
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

	const glow = document.getElementById("glow");
	const colorsGrid = document.getElementById("colors");
	const btnOn = document.getElementById("btn-on");
	const btnOff = document.getElementById("btn-off");
	const modeButtons = Array.from(document.querySelectorAll(".mode"));
	const faceImg = document.getElementById("face-img");
	const faceWrap = document.querySelector(".face");
	const infinityBtn = document.getElementById("infinity-btn");

	let isOn = false;
	// default until swatches are generated
	let currentColor = "#ffffff";
	const OFFICIAL_FACE = "images/bloombilya.png";
	let currentMode = "fixed";
	let modeInterval = null;

	function hexToRgba(hex, a = 1) {
		const h = hex.replace("#", "");
		const bigint = parseInt(h, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	}

	function applyGlow(colorHex) {
		if (!glow) return;
		// gentle white center + colored glow
		const c1 = "rgba(255,255,255,0.18)";
		const c2 = hexToRgba(colorHex, 0.82);
		const c3 = hexToRgba(colorHex, 0.28);
		glow.style.background = `radial-gradient(circle at 50% 40%, ${c1} 0%, ${c2} 22%, ${c3} 55%, transparent 70%), radial-gradient(circle at 50% 70%, ${hexToRgba(colorHex, 0.18)} 0%, transparent 82%)`;
		glow.style.boxShadow = `0 0 40px ${hexToRgba(
			colorHex,
			0.4,
		)}, 0 0 140px ${hexToRgba(colorHex, 0.18)}`;
	}

	function setColor(colorHex) {
		currentColor = colorHex;
		// keep official face visible
		if (faceImg) faceImg.src = OFFICIAL_FACE;
		for (const b of document.querySelectorAll(".color-btn")) {
			b.classList.toggle("selected", b.dataset.color === colorHex);
		}
		if (isOn) applyGlow(colorHex);
	}

	function turnOn() {
		if (isOn) return;
		isOn = true;
		faceWrap && faceWrap.classList.remove("off");
		glow && glow.classList.add("on");
		applyGlow(currentColor);
		startMode();
	}

	function turnOff() {
		if (!isOn) return;
		isOn = false;
		faceWrap && faceWrap.classList.add("off");
		glow && glow.classList.remove("on");
		stopMode();
	}

	function startMode() {
		stopMode();
		if (!isOn) return;
		if (currentMode === "fixed") {
			applyGlow(currentColor);
		} else if (currentMode === "random") {
			modeInterval = setInterval(() => {
				const btns = Array.from(document.querySelectorAll(".color-btn"));
				if (!btns.length) return;
				const chosen = btns[Math.floor(Math.random() * btns.length)];
				const c = chosen.dataset.color || "#ffffff";
				setColor(c);
			}, 800);
		} else if (currentMode === "blink") {
			let visible = true;
			modeInterval = setInterval(() => {
				visible = !visible;
				if (visible) glow.classList.add("on");
				else glow.classList.remove("on");
			}, 450);
		}
	}

	function stopMode() {
		if (modeInterval) {
			clearInterval(modeInterval);
			modeInterval = null;
		}
	}

	if (colorsGrid) {
		for (const swatch of COLOR_SWATCHES) {
			const btn = document.createElement("button");
			btn.className = "color-btn";
			btn.dataset.color = swatch.color;
			btn.setAttribute("aria-label", `Color from ${swatch.label}`);
			btn.style.background = swatch.color;
			btn.addEventListener("click", () => setColor(swatch.color));
			colorsGrid.appendChild(btn);
		}
	}

	// initial
	setColor(currentColor);

	// wire buttons
	btnOn && btnOn.addEventListener("click", turnOn);
	btnOff && btnOff.addEventListener("click", turnOff);

	// fullscreen functionality removed — layout uses fullscreen by default via CSS

	// infinity overlay (power toggle)
	infinityBtn && infinityBtn.addEventListener("click", () => (isOn ? turnOff() : turnOn()));

	// modes
	for (const btn of modeButtons) {
		btn.addEventListener("click", () => {
			for (const b of modeButtons) b.classList.remove("active");
			btn.classList.add("active");
			currentMode = btn.dataset.mode || "fixed";
			startMode();
		});
	}

	// keyboard quick toggle L
	document.addEventListener("keydown", (e) => {
		if (e.key === "l" || e.key === "L") isOn ? turnOff() : turnOn();
	});

	// visibility
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) stopMode();
		else if (isOn) startMode();
	});

	// Fix mobile viewport unit issues (particularly iOS) by setting a --vh CSS variable
	function setVhVar() {
		// prefer visualViewport when available for Chrome mobile accuracy
		const height =
			globalThis.visualViewport && globalThis.visualViewport.height
				? globalThis.visualViewport.height
				: window.innerHeight;
		const vh = height * 0.01;
		document.documentElement.style.setProperty("--vh", `${vh}px`);
	}

	// detect iOS to allow targeted CSS if needed
	function detectIOS() {
		const ua = navigator.userAgent || navigator.vendor || window.opera;
		if (
			/iPad|iPhone|iPod/.test(ua) ||
			(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
		) {
			document.documentElement.classList.add("is-ios");
		}
	}

	setVhVar();
	detectIOS();
	// recalc --vh on common mobile events that change the viewport (address bar, rotation)
	window.addEventListener("resize", setVhVar);
	window.addEventListener("orientationchange", setVhVar);
	window.addEventListener("pageshow", setVhVar);
	// visualViewport fires more reliably on Chrome when the address bar toggles
	if (globalThis.visualViewport && globalThis.visualViewport.addEventListener) {
		globalThis.visualViewport.addEventListener("resize", setVhVar);
	}
	// some browsers update innerHeight after touch interactions
	window.addEventListener("touchend", () => setTimeout(setVhVar, 50));

	// (removed previous inline CSS fallback to avoid layout conflicts)
});

// register service worker safely
(async () => {
	try {
		if ("serviceWorker" in navigator) await navigator.serviceWorker.register("/sw.js");
	} catch (e) {
		// silent fail
	}
})();
