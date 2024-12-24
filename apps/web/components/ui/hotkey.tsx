"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export const Hotkey = ({
  keys,
  modifier = false,
  variant = "primary",
}: {
  keys: string[]
  modifier?: boolean
  variant?: "primary" | "outline"
}) => {
  const [, setModifierText] = useState("⌃")
  const [displayKeys, setDisplayKeys] = useState(keys)
  const { theme } = useTheme()
  const isContrast = variant === "outline"

  useEffect(() => {
    const isMac = window?.navigator?.userAgent?.includes("Macintosh")
    setModifierText(isMac ? "⌘" : "⌃")
    setDisplayKeys(modifier ? [isMac ? "⌘" : "⌃", ...keys] : keys)
  }, [modifier, keys])

  const isDarkTheme = theme === "dark"

  const bgGradient = isDarkTheme
    ? "bg-gradient-to-bl from-transparent via-transparent to-background/20"
    : "bg-gradient-to-bl from-transparent via-transparent to-white/20"

  return (
    <span
      className={cn(
        "inline-flex gap-[2px]",
        isContrast ? "text-foreground" : "text-background",
      )}
    >
      {displayKeys.map((key, index) => (
        <kbd
          key={index}
          suppressHydrationWarning
          className={cn(
            "inline-flex items-center justify-center rounded border border-border font-sans text-[10px] font-medium h-4 w-4",
            index === 0 ? "ml-2" : "ml-[1px]",
            bgGradient,
            "bg-[length:100%_130%] bg-[0_100%]",
          )}
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
