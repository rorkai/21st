"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThemeToggleProps {
  fillIcon?: boolean
}

export function ThemeToggle({ fillIcon = true }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          className="group bg-transparent data-[state=on]:!bg-transparent hover:bg-accent hover:!text-foreground"
          pressed={resolvedTheme === "dark"}
          onPressedChange={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          size="sm"
        >
          {resolvedTheme === "dark" ? (
            <Sun
              size={18}
              strokeWidth={2}
              className={`shrink-0 ${fillIcon ? "fill-current" : ""}`}
              aria-hidden="true"
            />
          ) : (
            <Moon
              size={18}
              strokeWidth={2}
              className={`shrink-0 ${fillIcon ? "fill-current" : ""}`}
              aria-hidden="true"
            />
          )}
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
