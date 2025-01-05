"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          className="group bg-transparent data-[state=on]:!bg-transparent hover:bg-accent hover:!text-foreground mr-0.5"
          pressed={resolvedTheme === "dark"}
          onPressedChange={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
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
      </TooltipTrigger>
      <TooltipContent className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
        <p className="flex items-center gap-1.5">
          {resolvedTheme === "dark" ? "Light" : "Dark"} mode
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
