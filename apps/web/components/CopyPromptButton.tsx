"use client"

import { useState } from "react"
import { useAtom } from "jotai"
import { Check, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { trackEvent, AMPLITUDE_EVENTS } from "@/lib/amplitude"
import { getComponentInstallPrompt } from "@/lib/prompts"
import { selectedPromptTypeAtom, promptOptions } from "./ComponentPage"
import { PromptType } from "@/types/global"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import React from "react"

interface CopyPromptButtonProps {
  componentId: string
  componentName: string
  code: string | null
  demoCode?: string | null
  codeFileName?: string | null
  demoCodeFileName?: string | null
  registryDependencies?: Record<string, string> | null
  npmDependencies?: Record<string, string> | null
  npmDependenciesOfRegistryDependencies?: Record<string, string> | null
  tailwindConfig?: string | null
  globalCss?: string | null
  onOpenChange?: (open: boolean) => void
}

export function CopyPromptButton({
  componentId,
  componentName,
  code,
  demoCode = "",
  codeFileName = "component.tsx",
  demoCodeFileName = "demo.tsx",
  registryDependencies = {},
  npmDependencies = {},
  npmDependenciesOfRegistryDependencies = {},
  tailwindConfig = "",
  globalCss = "",
  onOpenChange,
}: CopyPromptButtonProps) {
  const [selectedPromptType, setSelectedPromptType] = useAtom(
    selectedPromptTypeAtom,
  )
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsLoading(true)

      // Получаем код компонента и демо
      const [componentCode, demoComponentCode] = await Promise.all([
        fetch(code || "").then((res) => res.text()),
        fetch(demoCode || "").then((res) => res.text()),
      ])

      const prompt = getComponentInstallPrompt({
        promptType: selectedPromptType,
        codeFileName: codeFileName?.split("/").slice(-1)[0] || "component.tsx",
        demoCodeFileName:
          demoCodeFileName?.split("/").slice(-1)[0] || "demo.tsx",
        code: componentCode,
        demoCode: demoComponentCode,
        registryDependencies: registryDependencies || {},
        npmDependencies: npmDependencies || {},
        npmDependenciesOfRegistryDependencies:
          npmDependenciesOfRegistryDependencies || {},
        tailwindConfig: tailwindConfig || "",
        globalCss: globalCss || "",
      })

      await copyToClipboard(prompt)
      setCopied(true)
      toast.success("AI prompt copied to clipboard")

      trackEvent(AMPLITUDE_EVENTS.COPY_AI_PROMPT, {
        componentId,
        componentName,
        promptType: selectedPromptType,
      })

      setTimeout(() => setCopied(false), 1000)
    } catch (err) {
      console.error("Failed to copy AI prompt:", err)
      toast.error("Failed to generate AI prompt")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
      }

      // Fallback для Safari
      const type = "text/plain"
      const blob = new Blob([text], { type })
      const data = [new ClipboardItem({ [type]: blob })]

      if (navigator?.clipboard?.write) {
        await navigator.clipboard.write(data)
        return
      }

      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      textarea.style.whiteSpace = "pre"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    } catch (err) {
      throw new Error("Failed to copy text")
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  const selectedOption = promptOptions.find(
    (opt) => opt.id === selectedPromptType,
  )

  return (
    <div className="inline-flex items-center gap-1">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              disabled={copied || isLoading}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors h-6 w-6 flex items-center justify-center relative"
            >
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all",
                  copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                )}
              >
                <Check size={16} className="stroke-emerald-500" />
              </div>
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all",
                  copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                  isLoading && "animate-spin",
                )}
              >
                {React.cloneElement(
                  selectedOption?.icon as React.ReactElement,
                  {
                    size: 16,
                  },
                )}
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy {selectedOption?.label || "AI"} prompt</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors h-6 w-4 flex items-center justify-center">
            <ChevronDown size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[--radix-dropdown-menu-content-width]"
        >
          <DropdownMenuRadioGroup
            value={selectedPromptType}
            onValueChange={(value) =>
              setSelectedPromptType(value as PromptType)
            }
          >
            {promptOptions.map((option) => (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                className="flex items-center gap-2"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {React.cloneElement(option.icon as React.ReactElement, {
                    size: 16,
                  })}
                </div>
                <span className="text-xs truncate ml-1">{option.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
