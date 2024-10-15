"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface HotkeyProps {
  keys: string[]
  modifier?: boolean
}

export const Hotkey: React.FC<HotkeyProps> = ({
  keys,
  modifier = false,
}) => {
  const [, setModifierText] = useState("⌃")
  const [displayKeys, setDisplayKeys] = useState(keys)
  const { theme } = useTheme()

  useEffect(() => {
    const isMac = window.navigator.userAgent.includes("Macintosh")
    setModifierText(isMac ? "⌘" : "⌃")
    setDisplayKeys(modifier ? [isMac ? "⌘" : "⌃", ...keys] : keys)
  }, [modifier, keys])

  const isDarkTheme = theme === 'dark'

  const textColor = isDarkTheme ? "text-foreground" : "text-foreground"
  const borderColor = isDarkTheme ? "border-border" : "border-border"
  const bgGradient = isDarkTheme 
    ? "bg-gradient-to-bl from-transparent via-transparent to-background/20" 
    : "bg-gradient-to-bl from-transparent via-transparent to-white/20"

  return (
    <span className="inline-flex gap-[2px]">
      {displayKeys.map((key, index) => (
        <kbd
          key={index}
          className={`inline-flex items-center justify-center rounded border ${borderColor} ${textColor} font-sans text-[10px] font-medium h-4 w-4 ${index === 0 ? "ml-2" : "ml-[1px]"} ${bgGradient} bg-[length:100%_130%] bg-[0_100%]`}
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
