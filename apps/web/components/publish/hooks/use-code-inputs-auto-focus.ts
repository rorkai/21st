import { useEffect, useRef } from "react"

export function useCodeInputsAutoFocus(showDetailedForm: boolean) {
  const demoCodeTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const codeInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (showDetailedForm) return

    if (codeInputRef.current) {
      codeInputRef.current?.focus?.()
    } else if (demoCodeTextAreaRef.current) {
      demoCodeTextAreaRef.current?.focus()
    }
  }, [showDetailedForm])

  return { codeInputRef, demoCodeTextAreaRef }
}
