// Taken from "tailwindcss-animate" npm package
// https://github.com/jamiebuilds/tailwindcss-animate/commit/ac0dd3a3c81681b78f1d8ea5e7478044213995e1

import { Config } from "tailwindcss"
import {
  createPluginCSSGenerator,
  createTailwindConfigFunction,
  generateMatchedUtilities,
} from "./utils"
import endent from "endent"

export const tailwindConfig: Config = {
  content: [],
  theme: {
    extend: {
      animationDelay: createTailwindConfigFunction(({ theme }) => ({
        ...theme("transitionDelay"),
      })),
      animationDuration: createTailwindConfigFunction(({ theme }) => ({
        DEFAULT: theme("transitionDuration.DEFAULT"),
        0: "0ms",
        ...theme("transitionDuration"),
      })),
      animationTimingFunction: createTailwindConfigFunction(({ theme }) => ({
        ...theme("transitionTimingFunction"),
      })),
      animationFillMode: {
        none: "none",
        forwards: "forwards",
        backwards: "backwards",
        both: "both",
      },
      animationDirection: {
        normal: "normal",
        reverse: "reverse",
        alternate: "alternate",
        "alternate-reverse": "alternate-reverse",
      },
      animationOpacity: createTailwindConfigFunction(({ theme }) => ({
        DEFAULT: 0,
        ...theme("opacity"),
      })),
      animationTranslate: createTailwindConfigFunction(({ theme }) => ({
        DEFAULT: "100%",
        ...theme("translate"),
      })),
      animationScale: createTailwindConfigFunction(({ theme }) => ({
        DEFAULT: 0,
        ...theme("scale"),
      })),
      animationRotate: createTailwindConfigFunction(({ theme }) => ({
        DEFAULT: "30deg",
        ...theme("rotate"),
      })),
      animationRepeat: {
        0: "0",
        1: "1",
        infinite: "infinite",
      },
      keyframes: {
        enter: {
          from: {
            opacity: "var(--tw-enter-opacity, 1)",
            transform:
              "translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))",
          },
        },
        exit: {
          to: {
            opacity: "var(--tw-exit-opacity, 1)",
            transform:
              "translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))",
          },
        },
      },
    },
  },
}

function generateAnimateUtilities(theme: (path: string) => any) {
  const keyframes = [
    // Keyframes
    `@keyframes enter {
      from {
        ${Object.entries(theme("keyframes.enter.from") || {})
          .map(([key, value]) => `${key}: ${value};`)
          .join("\n\t")}
      }
    }`,
    `@keyframes exit {
      to {
        ${Object.entries(theme("keyframes.exit.to") || {})
          .map(([key, value]) => `${key}: ${value};`)
          .join("\n\t")}
      }
    }`,
  ]
  const utilities = [
    // Base animation classes
    `.animate-in {
      animation-name: enter;
      animation-duration: ${theme("animationDuration.DEFAULT")};
      --tw-enter-opacity: initial;
      --tw-enter-scale: initial;
      --tw-enter-rotate: initial;
      --tw-enter-translate-x: initial;
      --tw-enter-translate-y: initial;
    }`,
    `.animate-out {
      animation-name: exit;
      animation-duration: ${theme("animationDuration.DEFAULT")};
      --tw-exit-opacity: initial;
      --tw-exit-scale: initial;
      --tw-exit-rotate: initial;
      --tw-exit-translate-x: initial;
      --tw-exit-translate-y: initial;
    }`,

    // Matched utilities
    ...generateMatchedUtilities(
      {
        "fade-in": (value) => ({ "--tw-enter-opacity": value }),
        "fade-out": (value) => ({ "--tw-exit-opacity": value }),
      },
      "animationOpacity",
    ),

    ...generateMatchedUtilities(
      {
        "zoom-in": (value) => ({ "--tw-enter-scale": value }),
        "zoom-out": (value) => ({ "--tw-exit-scale": value }),
      },
      "animationScale",
    ),

    ...generateMatchedUtilities(
      {
        "spin-in": (value) => ({ "--tw-enter-rotate": value }),
        "spin-out": (value) => ({ "--tw-exit-rotate": value }),
      },
      "animationRotate",
    ),

    ...generateMatchedUtilities(
      {
        "slide-in-from-top": (value) => ({
          "--tw-enter-translate-y": `-${value}`,
        }),
        "slide-in-from-bottom": (value) => ({
          "--tw-enter-translate-y": value,
        }),
        "slide-in-from-left": (value) => ({
          "--tw-enter-translate-x": `-${value}`,
        }),
        "slide-in-from-right": (value) => ({ "--tw-enter-translate-x": value }),
        "slide-out-to-top": (value) => ({
          "--tw-exit-translate-y": `-${value}`,
        }),
        "slide-out-to-bottom": (value) => ({ "--tw-exit-translate-y": value }),
        "slide-out-to-left": (value) => ({
          "--tw-exit-translate-x": `-${value}`,
        }),
        "slide-out-to-right": (value) => ({ "--tw-exit-translate-x": value }),
      },
      "animationTranslate",
    ),

    ...generateMatchedUtilities(
      { duration: (value) => ({ "animation-duration": value }) },
      "animationDuration",
      true,
    ),

    ...generateMatchedUtilities(
      { delay: (value) => ({ "animation-delay": value }) },
      "animationDelay",
    ),

    ...generateMatchedUtilities(
      { ease: (value) => ({ "animation-timing-function": value }) },
      "animationTimingFunction",
      true,
    ),

    // Static utilities
    `.running { animation-play-state: running; }`,
    `.paused { animation-play-state: paused; }`,

    ...generateMatchedUtilities(
      { "fill-mode": (value) => ({ "animation-fill-mode": value }) },
      "animationFillMode",
    ),

    ...generateMatchedUtilities(
      { direction: (value) => ({ "animation-direction": value }) },
      "animationDirection",
    ),

    ...generateMatchedUtilities(
      { repeat: (value) => ({ "animation-iteration-count": value }) },
      "animationRepeat",
    ),
  ]

  return endent`
    ${keyframes.join("\n\n")}

    @layer utilities {
      ${utilities.join("\n\n")}
    }
  `
}

export const generateGlobalsCSS = createPluginCSSGenerator({
  pluginConfig: tailwindConfig,
  generatePluginGlobalsCSS: generateAnimateUtilities,
})
