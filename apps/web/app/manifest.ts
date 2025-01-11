import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "21st.dev - The NPM for Design Engineers",
    short_name: "21st.dev",
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui. Built by design engineers, for design engineers.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#09090B",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  }
}
