/* eslint-disable @next/next/no-img-element */
import React from "react"

export const UserAvatar = ({
  src,
  alt,
  size = 40,
  isClickable,
}: {
  src?: string
  alt?: string | null
  size?: number
  isClickable?: boolean
}) => {
  return (
    <div
      className={`relative rounded-full overflow-hidden bg-muted ${isClickable ? "group" : ""}`}
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
      <img
        src={src}
        alt={alt ?? undefined}
        width={size}
        height={size}
        className="object-cover"
      />
    </div>
  )
}
