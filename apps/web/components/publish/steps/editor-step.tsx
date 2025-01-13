import { motion } from "framer-motion"
import { Editor } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { ChevronLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "../utils"
import { editorThemes, editorOptions } from "../editor-themes"

type EditorFieldName = keyof Pick<FormData, "code" | "demo_code">

interface EditorStepProps {
  form: UseFormReturn<FormData>
  isDarkTheme: boolean
  fieldName: EditorFieldName
  label: string
  value: string
  isValid: boolean
  onBack: () => void
  onContinue: () => void
  height?: string
  language?: string
  onChange?: (value: string) => void
  continueButtonText?: string
}

export function EditorStep({
  form,
  isDarkTheme,
  fieldName,
  label,
  value,
  isValid,
  onBack,
  onContinue,
  height = "70vh",
  language = "typescript",
  onChange,
  continueButtonText = "Continue",
}: EditorStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="w-full"
    >
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="w-full relative">
            {label && <Label>{label}</Label>}
            <FormControl>
              <motion.div
                className="relative"
                animate={{
                  height,
                }}
                transition={{ duration: 0.3 }}
              >
                <Editor
                  defaultLanguage={language}
                  value={value}
                  onChange={(value) => {
                    onChange?.(value || "")
                    field.onChange(value || "")
                  }}
                  theme={isDarkTheme ? "github-dark" : "github-light"}
                  options={editorOptions}
                  beforeMount={(monaco) => {
                    monaco.editor.defineTheme("github-dark", editorThemes.dark)
                    monaco.editor.defineTheme(
                      "github-light",
                      editorThemes.light,
                    )
                  }}
                  className={cn(
                    "h-full w-full flex-grow rounded-md overflow-hidden",
                    "border border-input focus-within:ring-1 focus-within:ring-ring",
                  )}
                />
                <div className="absolute flex gap-2 bottom-2 right-2 z-50 h-[36px]">
                  <Button size="icon" variant="outline" onClick={onBack}>
                    <ChevronLeftIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" disabled={!isValid} onClick={onContinue}>
                    {continueButtonText}
                  </Button>
                </div>
              </motion.div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  )
}
