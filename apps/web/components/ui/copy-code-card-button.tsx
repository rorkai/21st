import { useState, useEffect } from "react"
import { useSandpack } from "@codesandbox/sandpack-react"
import { toast } from "sonner"
import { CheckIcon, Clipboard } from "lucide-react"
import { trackEvent, AMPLITUDE_EVENTS } from "../../lib/amplitude"
import { useSupabaseAnalytics } from "@/hooks/use-analytics"
import { AnalyticsActivityType } from "@/types/global"

export const CopyCodeButton = ({
  component_id,
  user_id,
}: {
  component_id: number
  user_id?: string
}) => {
  const [codeCopied, setCodeCopied] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)
  const { sandpack } = useSandpack()
  const { capture } = useSupabaseAnalytics()

  const copyCode = (source: "button" | "shortcut") => {
    const activeFile = sandpack.activeFile
    const fileContent = sandpack.files[activeFile]?.code
    if (fileContent) {
      navigator?.clipboard?.writeText(fileContent)
      setCodeCopied(true)
      toast("Code copied to clipboard")
      trackEvent(AMPLITUDE_EVENTS.COPY_CODE, {
        fileName: activeFile,
        fileExtension: activeFile.split(".").pop(),
        copySource: source,
      })
      capture(component_id, AnalyticsActivityType.COMPONENT_CODE_COPY, user_id)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.keyCode === 67) {
        const commandMenu = document.querySelector("[cmdk-root]")
        if (commandMenu) return

        const selectedText = window.getSelection()?.toString()
        if (!selectedText) {
          e.preventDefault()
          copyCode("shortcut")
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [sandpack])

  useEffect(() => {
    const handleSelectionChange = () => {
      const selectedText = window.getSelection()?.toString()
      setHasSelection(!!selectedText)
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange)
  }, [])

  return (
    <button
      onClick={() => copyCode("button")}
      className="absolute flex items-center gap-1 top-12 right-2 md:right-4 z-10 p-1 px-2 bg-background text-foreground border border-border rounded-md hover:bg-accent transition-colors md:flex h-8"
    >
      {codeCopied ? (
        <>
          <CheckIcon size={14} className="text-green-500" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Clipboard size={14} className="text-muted-foreground/70" />
          Copy Code{" "}
          <kbd
            className={`hidden md:inline-flex h-5 max-h-full items-center rounded border border-border px-1 ml-1 -mr-1 font-[inherit] text-[0.625rem] font-medium ${
              hasSelection
                ? "text-muted-foreground/40"
                : "text-muted-foreground/70"
            }`}
          >
            {navigator?.platform?.toLowerCase()?.includes("mac")
              ? "⌘C"
              : "Ctrl+C"}
          </kbd>
        </>
      )}
    </button>
  )
}
