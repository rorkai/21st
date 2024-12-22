import { useSandpack } from "@codesandbox/sandpack-react"
import { CheckIcon, Clipboard } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { trackEvent, AMPLITUDE_EVENTS } from "../lib/amplitude"

export const CopyCodeButton = () => {
  const [codeCopied, setCodeCopied] = useState(false)
  const { sandpack } = useSandpack()

  const copyCode = () => {
    const activeFile = sandpack.activeFile
    const fileContent = sandpack.files[activeFile]?.code
    if (fileContent) {
      navigator.clipboard.writeText(fileContent)
      setCodeCopied(true)
      toast("Code copied to clipboard")
      trackEvent(AMPLITUDE_EVENTS.COPY_CODE, {
        fileName: activeFile,
        fileExtension: activeFile.split('.').pop(),
        copySource: 'button',
      })
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={copyCode}
      className="absolute flex items-center gap-2 top-12 right-2 z-10 p-1 px-2 bg-background text-foreground border border-border rounded-md hover:bg-accent transition-colors"
    >
      Copy Code {codeCopied ? <CheckIcon size={16} /> : <Clipboard size={16} />}
    </button>
  )
}
