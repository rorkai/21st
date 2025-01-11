"use client"

import { useEffect } from "react"
import { AMPLITUDE_EVENTS, trackEvent } from "@/lib/amplitude"

export function UserProfileAnalytics({
  username,
  isManuallyAdded,
}: {
  username: string
  isManuallyAdded: boolean
}) {
  useEffect(() => {
    trackEvent(AMPLITUDE_EVENTS.VIEW_USER_PROFILE, {
      username,
      isManuallyAdded,
    })
  }, [username])

  return null
}
