"use client"

import type { Variants } from "framer-motion"
import { motion, AnimationControls } from "framer-motion"

const lineVariants: Variants = {
  normal: { opacity: 1 },
  hover: {
    opacity: [1, 0, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

const TerminalIcon = ({
  size = 28,
  controls,
}: {
  size?: number
  controls: AnimationControls
}) => {
  return (
    <div className="select-none rounded-md transition-colors duration-200 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="4 17 10 11 4 5" />
        <motion.line
          x1="12"
          x2="20"
          y1="19"
          y2="19"
          variants={lineVariants}
          animate={controls}
          initial="normal"
        />
      </svg>
    </div>
  )
}

export { TerminalIcon }
