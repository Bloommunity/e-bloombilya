import type { Config } from "tailwindcss";

export default <Partial<Config>>{
	content: [
		"./app.vue",
		"./components/**/*.{vue,js,ts}",
		"./layouts/**/*.{vue,js,ts}",
		"./pages/**/*.{vue,js,ts}",
		"./plugins/**/*.{js,ts}",
		"./nuxt.config.{js,ts}",
	],
	theme: {
		extend: {
			boxShadow: {
				glass: "0 30px 80px rgba(0, 0, 0, 0.45)",
			},
		},
	},
};
