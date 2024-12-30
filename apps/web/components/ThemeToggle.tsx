"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Toggle
      className="group bg-transparent data-[state=on]:!bg-transparent hover:bg-accent hover:!text-foreground mr-0.5"
      pressed={resolvedTheme === "dark"}
      onPressedChange={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      size="sm"
    >
      <Moon
        size={16}
        strokeWidth={2}
        className="shrink-0 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
        aria-hidden="true"
      />
      <Sun
        size={16}
        strokeWidth={2}
        className="absolute shrink-0 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
        aria-hidden="true"
      />
    </Toggle>
  )
}
