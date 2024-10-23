import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "./utils"

export const useSubmitFormHotkeys = (
  form: UseFormReturn<FormData>,
  // eslint-disable-next-line no-unused-vars
  handleSubmit: (event: React.FormEvent) => void,
) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      const formData = form.getValues()
      const isFormComplete = formData.name && formData.preview_url
      if (isFormComplete) {
        if (e.code === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          handleSubmit(e as unknown as React.FormEvent)
        }
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [form, handleSubmit])
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
