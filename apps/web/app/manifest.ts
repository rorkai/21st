import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '21st.dev - The NPM for Design Engineers',
    short_name: '21st.dev',
    description: 'Ship polished UI faster with ready-to-use Tailwind components. Built by design engineers, for design engineers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
} 