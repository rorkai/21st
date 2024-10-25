import type { Config } from "tailwindcss"

export const tailwindVersion = "3.4.5"

export const tailwindConfig: Config = {
  content: [
    "**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
}

export const globalCSS: string = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`

