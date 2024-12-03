"use client"

import { useState, useEffect } from "react"

interface ComponentPreviewImageProps {
  src: string
  alt: string
  fallbackSrc: string
  className?: string
}

export default function ComponentPreviewImage({
  src,
  alt,
  fallbackSrc,
  className,
}: ComponentPreviewImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isPlaceholder, setIsPlaceholder] = useState(src === fallbackSrc)

  useEffect(() => {
    setImgSrc(src)
    setIsPlaceholder(src === fallbackSrc)
  }, [src, fallbackSrc])

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        setImgSrc(fallbackSrc)
        setIsPlaceholder(true)
      }}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        backgroundColor: isPlaceholder ? "transparent" : "",
      }}
    />
  )
}
