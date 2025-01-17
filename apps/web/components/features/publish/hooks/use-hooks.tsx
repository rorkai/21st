import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { FormData, isFormValid } from "../config/utils"

export const useSubmitFormHotkeys = (
  form: UseFormReturn<FormData>,
  // eslint-disable-next-line no-unused-vars
  handleSubmit: (event: React.FormEvent) => void,
  enabled: boolean,
) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      const isFormComplete = isFormValid(form)
      if (isFormComplete && enabled) {
        if (e.code === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          handleSubmit(e as unknown as React.FormEvent)
        }
      }
    }

    if (enabled) {
      window.addEventListener("keydown", keyDownHandler)
    }

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [form, handleSubmit, enabled])
}

export const useSuccessDialogHotkeys = ({
  isOpen,
  onAddAnother,
  onGoToComponent,
}: {
  isOpen: boolean
  onAddAnother: () => void
  onGoToComponent: () => void
}) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (isOpen && e.code === "KeyN") {
        e.preventDefault()
        onAddAnother()
      }
      if (isOpen && e.code === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onGoToComponent()
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [isOpen, onAddAnother, onGoToComponent])
}
