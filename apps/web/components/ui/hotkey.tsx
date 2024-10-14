"use client"

import React from "react"
import { useEffect, useState } from "react"

interface HotkeyProps {
  keys: string[]
  isDarkBackground?: boolean
  modifier?: boolean
}

export const Hotkey: React.FC<HotkeyProps> = ({
  keys,
  isDarkBackground = false,
  modifier = false,
}) => {
  const [, setModifierText] = useState("⌃")
  const [displayKeys, setDisplayKeys] = useState(keys)

  useEffect(() => {
    const isMac = window.navigator.userAgent.includes("Macintosh")
    setModifierText(isMac ? "⌘" : "⌃")
    setDisplayKeys(modifier ? [isMac ? "⌘" : "⌃", ...keys] : keys)
  }, [modifier, keys])

  const textColor = isDarkBackground ? "text-white" : "text-black"
  const borderColor = isDarkBackground ? "border-gray-600" : "border-gray-300"

  return (
    <span className="inline-flex gap-1">
      {displayKeys.map((key, index) => (
        <kbd
          key={index}
          className={`inline-flex items-center justify-center rounded border ${borderColor} ${textColor} font-sans text-[10px] font-medium h-4 w-4 ${index === 0 ? "ml-2" : "ml-[1px]"} bg-gradient-to-bl from-transparent via-transparent to-white/20 bg-[length:100%_130%] bg-[0_100%]`}
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
