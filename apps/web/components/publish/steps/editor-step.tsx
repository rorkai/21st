import { Editor } from "@monaco-editor/react"

import { FormField, FormItem, FormControl } from "@/components/ui/form"

import { UseFormReturn } from "react-hook-form"
import { FormData } from "../utils"
import { editorOptions } from "../editor-themes"

type EditorFieldName =
  | keyof Pick<FormData, "code" | "tailwind_config" | "globals_css">
  | `demos.${number}.demo_code`

interface EditorStepProps {
  form: UseFormReturn<FormData>
  isDarkTheme: boolean
  fieldName: EditorFieldName
  value: string
  onChange: (value: string) => void
  language?: string
}

export function EditorStep({
  form,
  isDarkTheme,
  fieldName,
  value,
  onChange,
  language = "typescript",
}: EditorStepProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="h-full">
          <FormControl>
            <Editor
              defaultLanguage={language}
              value={value}
              onChange={(value) => {
                onChange(value || "")
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
