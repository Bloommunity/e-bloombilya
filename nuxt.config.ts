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
				{ property: "og:title", content: "E-Bloombilya — Virtual Lightstick" },
				{
					property: "og:description",
					content:
						"A BINI-inspired virtual lightstick app with official lightstick styling, color swatches, and animated glow modes.",
				},
				{ property: "og:image", content: "/images/bloombilya.png" },
				{ property: "og:image:type", content: "image/png" },
				{ property: "og:image:width", content: "1563" },
				{ property: "og:image:height", content: "1563" },
				{ property: "og:image:alt", content: "E-Bloombilya virtual lightstick" },
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: "E-Bloombilya — Virtual Lightstick" },
				{
					name: "twitter:description",
					content:
						"A BINI-inspired virtual lightstick app with official lightstick styling, color swatches, and animated glow modes.",
				},
				{ name: "twitter:image", content: "/images/bloombilya.png" },
				{ name: "twitter:image:alt", content: "E-Bloombilya virtual lightstick" },
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
