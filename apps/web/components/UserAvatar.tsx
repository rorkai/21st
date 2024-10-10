/* eslint-disable @next/next/no-img-element */
import React from "react"

interface UserAvatarProps {
  src: string
  alt: string
  size?: number
  isClickable?: boolean
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt,
  size = 40,
  isClickable,
}) => {
  return (
    <div
      className={`relative rounded-full overflow-hidden ${isClickable ? "group" : ""}`}
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
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
      />
    </div>
  )
}
