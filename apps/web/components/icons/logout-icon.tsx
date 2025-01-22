"use client"

import type { Variants } from "framer-motion"
import { motion, AnimationControls } from "framer-motion"

const pathVariants: Variants = {
  normal: { x: 0, translateX: 0 },
  hover: {
    x: 2,
    translateX: [0, -3, 0],
    transition: {
      duration: 0.4,
    },
  },
}

const LogoutIcon = ({
  size = 16,
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
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <motion.polyline
          points="16 17 21 12 16 7"
          variants={pathVariants}
          animate={controls}
          initial="normal"
        />
        <motion.line
          x1="21"
          x2="9"
          y1="12"
          y2="12"
          variants={pathVariants}
          animate={controls}
          initial="normal"
        />
      </svg>
    </div>
  )
}

export { LogoutIcon }
