export default defineNuxtConfig({
	modules: ["@nuxtjs/tailwindcss"],
	css: ["~/assets/css/main.css"],
	app: {
		head: {
			title: "E-Bloombilya — Virtual Lightstick",
			meta: [
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1, viewport-fit=cover",
				},
				{ name: "theme-color", content: "#050816" },
				{
					name: "description",
					content:
						"A Nuxt-powered virtual lightstick with color swatches, modes, and animated glow effects.",
				},
			],
			link: [
				{ rel: "manifest", href: "/manifest.webmanifest" },
				{ rel: "icon", href: "/images/favicon.ico" },
				{ rel: "apple-touch-icon", href: "/images/favicon.ico" },
			],
		},
	},
});
