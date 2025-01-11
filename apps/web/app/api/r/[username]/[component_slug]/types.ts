// Represents a file associated with the component
type ComponentFile = {
  path: string // e.g., "magicui/marquee.tsx"
  content: string // e.g., "import React from 'react';\n\nconst Marquee = () => {...}"
  type: string // e.g., "registry:ui"
  target: string // e.g., "" (often empty)
}

// Represents the Tailwind CSS configuration
type TailwindConfig = {
  theme: {
    extend: {
      // Custom animation definitions
      animation?: Record<string, string> // e.g., { "marquee": "marquee var(--duration) infinite linear" }
      // Custom keyframe definitions
      keyframes?: Record<string, Record<string, object>> // e.g., { "marquee": { "from": { "transform": "translateX(0)" }, "to": { "transform": "translateX(calc(-100% - var(--gap)))" } } }
      // Custom color definitions
      colors?: Record<string, string> // e.g., { "color-1": "hsl(var(--color-1))" }
    }
  }
}

// Represents CSS variables for light and dark themes
type CssVars = {
  light: Record<string, string> // e.g., { "--color-1": "0 100% 63%" }
  dark: Record<string, string> // e.g., { "--color-1": "0 100% 63%" }
}

// Represents the complete component response structure
export type ComponentRegistryResponse = {
  name: string // e.g., "marquee"
  type: string // e.g., "registry:ui"
  dependencies?: string[] // e.g., ["framer-motion", "next-themes"]
  files: ComponentFile[] // Array of ComponentFile objects
  tailwind?: {
    config: TailwindConfig
  }
  cssVars?: CssVars
}

// Example usage:
// const componentResponse: ComponentResponse = {
//   name: "marquee",
//   type: "registry:ui",
//   dependencies: ["framer-motion"],
//   files: [
//     {
//       path: "magicui/marquee.tsx",
//       content: "import React from 'react';\n\nconst Marquee = () => {...}",
//       type: "registry:ui",
//       target: ""
//     }
//   ],
//   tailwind: {
//     config: {
//       theme: {
//         extend: {
//           animation: {
//             "marquee": "marquee var(--duration) infinite linear"
//           },
//           keyframes: {
//             marquee: {
//               from: { transform: "translateX(0)" },
//               to: { transform: "translateX(calc(-100% - var(--gap)))" }
//             }
//           }
//         }
//       }
//     }
//   },
//   cssVars: {
//     light: { "--color-1": "0 100% 63%" },
//     dark: { "--color-1": "0 100% 63%" }
//   }
// }
