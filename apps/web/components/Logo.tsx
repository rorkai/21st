import React from "react"
import Link from "next/link"

interface LogoProps {
  size?: number
}

export const Logo: React.FC<LogoProps> = ({
  size = 28,
}) => {
  return (
    <Link href="/">
      <div
        className="relative rounded-full overflow-hidden group cursor-pointer"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 bg-gradient-radial from-white/30 to-transparent z-10"
          style={{
            backgroundPosition: "top left",
            backgroundSize: "100% 100%",
            transform: "rotate(-45deg) ",
            opacity: 0.5,
          }}
        />
        <div className="shimmer-effect" />
        <div
          className="w-full h-full bg-black"
        />
      </div>
    </Link>
  )
}
