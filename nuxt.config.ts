export default defineNuxtConfig({
	modules: ["@nuxtjs/tailwindcss"],
	css: ["~/assets/css/main.css"],
	experimental: {
		appManifest: false,
	},
	app: {
		head: {
			htmlAttrs: {
				lang: "en",
			},
			title: "E-Bloombilya — Virtual Lightstick",
			meta: [
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1, viewport-fit=cover",
				},
				{ name: "theme-color", content: "#050816" },
				{ name: "application-name", content: "E-Bloombilya" },
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{ name: "mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
				{
					name: "description",
					content:
						"E-Bloombilya is a BINI-inspired virtual lightstick app with official lightstick styling, color swatches, and animated glow modes.",
				},
			],
			link: [
				{
					rel: "preload",
					as: "image",
					href: "/images/bloombilya-768.png",
					imagesrcset:
						"/images/bloombilya-512.png 512w, /images/bloombilya-768.png 768w, /images/bloombilya.png 1563w",
					imagesizes: "(max-width: 768px) 255px, 540px",
				},
				{ rel: "manifest", href: "/manifest.webmanifest" },
				{ rel: "icon", href: "/images/bloombilya.png", type: "image/png" },
				{ rel: "apple-touch-icon", href: "/images/bloombilya.png" },
			],
		},
	},
});
