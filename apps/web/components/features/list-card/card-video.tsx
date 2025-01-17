"use client"

import { useRef, useState } from "react"
import { Component, User, DemoWithComponent } from "../../../types/global"

interface ComponentVideoPreviewProps {
  component: DemoWithComponent | (Component & { user: User })
  demo?: DemoWithComponent | (Component & { user: User })
}

export function ComponentVideoPreview({
  component,
  demo,
}: ComponentVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  const isDemo = "component" in component

  const id = isDemo ? component.id : component.id
  const videoUrl = isDemo
    ? component.video_url
    : (component as Component & { user: User }).video_url

  const toggleVideoIcon = (hide: boolean) => {
    const videoIcon = document.querySelector(
      `[data-video-icon="${id}"]`,
    ) as HTMLElement
    if (videoIcon) {
      videoIcon.style.opacity = hide ? "0" : "1"
      videoIcon.style.visibility = hide ? "hidden" : "visible"
    }
  }

  const playVideo = () => {
    toggleVideoIcon(true)
    const videoElement = videoRef.current

    if (!videoElement || !videoUrl) {
      return
    }

    if (!isVideoLoaded) {
      videoElement.src = videoUrl
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
        data-video={`${id}`}
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
