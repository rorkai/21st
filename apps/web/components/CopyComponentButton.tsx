"use client"

import { useState } from "react"

import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CopyComponentButtonProps {
  codeUrl: string
}

export function CopyComponentButton({ codeUrl }: CopyComponentButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsLoading(true)
      const response = await fetch(codeUrl)
      const code = await response.text()
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast("Copied to clipboard")
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error("Failed to copy code:", err)
      toast.error("Failed to copy code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity",
              "bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-none",
              "w-8 h-8 p-0",
              "disabled:opacity-100 border-0",
            )}
            onClick={handleCopy}
            disabled={copied || isLoading}
          >
            <div
              className={cn(
                "transition-all",
                copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            >
              <Check
                className="stroke-emerald-500"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <div
              className={cn(
                "absolute transition-all",
                copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                isLoading && "animate-spin",
              )}
            >
              <Copy size={16} strokeWidth={2} aria-hidden="true" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy code</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
