// This is a hack, but Sandpack by CodeSandbox currently doesn't support PostCSS (nodebox is not working)
// That's why we are using Tailwind Play CDN
// But it doesn't support third-party plugins like tailwind-animated
// So we need to add it manually to the Sandpack
// TODO: Find a better way to do this
// TODO: Check code discrepancies between tailwind-animated and this AI-generated file
import { Config } from "tailwindcss"

export const tailwindVersion = "3.4.5"

export const tailwindConfig: Config = {
  content: [],
  theme: {
    extend: {
      /* Animation configurations */
      animationDelay: {
        none: "0ms",
        0: "0ms",
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
        1000: "1000ms",
      },
      animationDuration: {
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
        1000: "1000ms",
      },
      animationTimingFunction: {
        DEFAULT: "ease",
        linear: "linear",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animationIteration: {
        infinite: "infinite",
        once: "1",
        twice: "2",
        thrice: "3",
        1: "1",
        2: "2",
        3: "3",
      },
      animation: {
        spin: "spin var(--tw-animate-duration, 1s) var(--tw-animate-easing, linear) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, infinite) var(--tw-animate-fill, none)",
        ping: "ping var(--tw-animate-duration, 1s) var(--tw-animate-easing, cubic-bezier(0, 0, 0.2, 1)) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, infinite) var(--tw-animate-fill, none)",
        pulse:
          "pulse var(--tw-animate-duration, 2s) var(--tw-animate-easing, cubic-bezier(0.4, 0, 0.6, 1)) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, infinite) var(--tw-animate-fill, none)",
        bounce:
          "bounce var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, infinite) var(--tw-animate-fill, none)",
        wiggle:
          "wiggle var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "wiggle-more":
          "wiggle-more var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "rotate-y":
          "rotate-y var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "rotate-x":
          "rotate-x var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        jump: "jump var(--tw-animate-duration, 500ms) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "jump-in":
          "jump-in var(--tw-animate-duration, 500ms) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "jump-out":
          "jump-out var(--tw-animate-duration, 500ms) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        shake:
          "shake var(--tw-animate-duration, 500ms) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        fade: "fade var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "fade-down":
          "fade-down var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "fade-up":
          "fade-up var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "fade-left":
          "fade-left var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "fade-right":
          "fade-right var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "flip-up":
          "flip-up var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
        "flip-down":
          "flip-down var(--tw-animate-duration, 1s) var(--tw-animate-easing, ease) var(--tw-animate-delay, 0s) var(--tw-animate-iteration, 1) var(--tw-animate-fill, both)",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "wiggle-more": {
          "0%, 100%": { transform: "rotate(-12deg)" },
          "50%": { transform: "rotate(12deg)" },
        },
        "rotate-y": {
          "0%": { transform: "rotateY(360deg)" },
          "100%": { transform: "rotateY(0)" },
        },
        "rotate-x": {
          "0%": { transform: "rotateX(360deg)" },
          "100%": { transform: "rotateX(0)" },
        },
        jump: {
          "0%, 100%": { transform: "scale(100%)" },
          "10%": { transform: "scale(80%)" },
          "50%": { transform: "scale(120%)" },
        },
        "jump-in": {
          "0%": { transform: "scale(0%)" },
          "80%": { transform: "scale(120%)" },
          "100%": { transform: "scale(100%)" },
        },
        "jump-out": {
          "0%": { transform: "scale(100%)" },
          "20%": { transform: "scale(120%)" },
          "100%": { transform: "scale(0%)" },
        },
        shake: {
          "0%": { transform: "translateX(0rem)" },
          "25%": { transform: "translateX(-1rem)" },
          "75%": { transform: "translateX(1rem)" },
          "100%": { transform: "translateX(0rem)" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-down": {
          "0%": { opacity: "0", transform: "translateY(-2rem)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(2rem)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-left": {
          "0%": { opacity: "0", transform: "translateX(2rem)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-right": {
          "0%": { opacity: "0", transform: "translateX(-2rem)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "flip-up": {
          "0%": { transform: "rotateX(90deg)", transformOrigin: "bottom" },
          "100%": { transform: "rotateX(0)", transformOrigin: "bottom" },
        },
        "flip-down": {
          "0%": { transform: "rotateX(-90deg)", transformOrigin: "top" },
          "100%": { transform: "rotateX(0)", transformOrigin: "top" },
        },
      },
    },
  },
}

export const globalCSS: string = `
@layer utilities {
  /* Composition utilities */
  .animate-replace {
    --tw-animate-composition: replace;
    animation-composition: var(--tw-animate-composition);
  }
  .animate-add {
    --tw-animate-composition: add;
    animation-composition: var(--tw-animate-composition);
  }
  .animate-accumulate {
    --tw-animate-composition: accumulate;
    animation-composition: var(--tw-animate-composition);
  }

  /* Direction utilities */
  .animate-normal {
    --tw-animate-direction: normal;
    animation-direction: var(--tw-animate-direction);
  }
  .animate-reverse {
    --tw-animate-direction: reverse;
    animation-direction: var(--tw-animate-direction);
  }
  .animate-alternate {
    --tw-animate-direction: alternate;
    animation-direction: var(--tw-animate-direction);
  }
  .animate-alternate-reverse {
    --tw-animate-direction: alternate-reverse;
    animation-direction: var(--tw-animate-direction);
  }

  /* Fill mode utilities */
  .animate-fill-none {
    --tw-animate-fill: none;
    animation-fill-mode: var(--tw-animate-fill);
  }
  .animate-fill-forwards {
    --tw-animate-fill: forwards;
    animation-fill-mode: var(--tw-animate-fill);
  }
  .animate-fill-backwards {
    --tw-animate-fill: backwards;
    animation-fill-mode: var(--tw-animate-fill);
  }
  .animate-fill-both {
    --tw-animate-fill: both;
    animation-fill-mode: var(--tw-animate-fill);
  }

  /* Iteration count utilities */
  .animate-infinite {
    --tw-animate-iteration: infinite;
    animation-iteration-count: var(--tw-animate-iteration);
  }
  .animate-once {
    --tw-animate-iteration: 1;
    animation-iteration-count: var(--tw-animate-iteration);
  }
  .animate-twice {
    --tw-animate-iteration: 2;
    animation-iteration-count: var(--tw-animate-iteration);
  }
  .animate-thrice {
    --tw-animate-iteration: 3;
    animation-iteration-count: var(--tw-animate-iteration);
  }

  /* Play state utilities */
  .animate-run {
    --tw-animate-state: running;
    animation-play-state: var(--tw-animate-state);
  }
  .animate-play {
    --tw-animate-state: running;
    animation-play-state: var(--tw-animate-state);
  }
  .animate-stop {
    --tw-animate-state: paused;
    animation-play-state: var(--tw-animate-state);
  }
  .animate-pause {
    --tw-animate-state: paused;
    animation-play-state: var(--tw-animate-state);
  }
}
`
