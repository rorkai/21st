"use client"

import { useRef, useState } from "react"
import { Component, User } from "../types/global"

interface ComponentVideoPreviewProps {
  component: Component & { user: User }
}

export function ComponentVideoPreview({
  component,
}: ComponentVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  const toggleVideoIcon = (hide: boolean) => {
    const videoIcon = document.querySelector(
      `[data-video-icon-${component.id}]`,
    ) as HTMLElement
    if (videoIcon) {
      videoIcon.style.opacity = hide ? "0" : "1"
      videoIcon.style.visibility = hide ? "hidden" : "visible"
    }
  }

  const playVideo = () => {
    toggleVideoIcon(true)
    const videoElement = videoRef.current

    if (!videoElement || !component.video_url) {
      return
    }

    if (!isVideoLoaded) {
      videoElement.src = component.video_url
      videoElement.load()
      videoElement
        .play()
        .then(() => {
          setIsVideoLoaded(true)
        })
        .catch(() => {})
    } else {
      videoElement.currentTime = 0
      videoElement.play().catch(() => {})
    }
  }

  const stopVideo = () => {
    toggleVideoIcon(false)
    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.pause()
    }
  }

  return (
    <div
      onMouseEnter={playVideo}
      onMouseLeave={stopVideo}
      onTouchStart={playVideo}
      onTouchEnd={stopVideo}
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden"
    >
      <video
        ref={videoRef}
        data-video={`${component.id}`}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        className="absolute"
        style={{
          objectFit: "cover",
          display: "block",
          width: "calc(100% + 2px)",
          height: "calc(100% + 2px)",
          left: "-1px",
          top: "-1px",
        }}
      />
    </div>
  )
}
