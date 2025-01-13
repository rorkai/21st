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
  value: string
  onChange?: (value: string) => void
}

export function EditorStep({
  form,
  isDarkTheme,
  fieldName,
  value,
  onChange,
}: EditorStepProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="h-full">
          <FormControl>
            <Editor
              defaultLanguage="typescript"
              value={value}
              onChange={(value) => {
                onChange?.(value || "")
                field.onChange(value || "")
              }}
              theme={isDarkTheme ? "vs-dark" : "light"}
              options={{
                ...editorOptions,
                roundedSelection: false,
                minimap: { enabled: false },
                lineNumbers: "on",
                lineNumbersMinChars: 3,
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  useShadows: false,
                },
                padding: { top: 16, bottom: 16 },
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 0,
              }}
              className="h-full w-full bg-muted"
              beforeMount={(monaco) => {
                monaco.editor.defineTheme("vs-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [],
                  colors: {
                    "editor.background": "#1c1c1c", // --muted в dark режиме
                  },
                })
                monaco.editor.defineTheme("light", {
                  base: "vs",
                  inherit: true,
                  rules: [],
                  colors: {
                    "editor.background": "#f5f5f5", // --muted в light режиме
                  },
                })
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
