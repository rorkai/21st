import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Editor } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "../utils"

interface CustomizationStepProps {
  form: UseFormReturn<FormData>
  isDarkTheme: boolean
  customTailwindConfig: string | undefined
  customGlobalCss: string | undefined
  onBack: () => void
  onContinue: () => void
  onTailwindConfigChange: (value: string) => void
  onGlobalCssChange: (value: string) => void
}

export function CustomizationStep({
  form,
  isDarkTheme,
  customTailwindConfig,
  customGlobalCss,
  onBack,
  onContinue,
  onTailwindConfigChange,
  onGlobalCssChange,
}: CustomizationStepProps) {
  const EditorWrapper = ({
    language,
    value,
    onChange,
  }: {
    language: string
    value: string
    onChange: (value: string) => void
  }) => (
    <div className="relative flex flex-col gap-2">
      <Editor
        defaultLanguage={language}
        value={value}
        onChange={(value) => onChange(value || "")}
        theme={isDarkTheme ? "github-dark" : "github-light"}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "off",
          folding: true,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          renderLineHighlight: "none",
          contextmenu: false,
          formatOnPaste: false,
          formatOnType: false,
          quickSuggestions: false,
          suggest: {
            showKeywords: false,
            showSnippets: false,
          },
          renderValidationDecorations: "off",
          hover: { enabled: false },
          inlayHints: { enabled: "off" },
          occurrencesHighlight: "off",
          selectionHighlight: false,
        }}
        className={cn(
          "h-[500px] w-full rounded-md overflow-hidden",
          "border border-input focus-within:ring-1 focus-within:ring-ring",
        )}
      />
      <div className="absolute flex gap-2 bottom-2 right-2 z-50 h-[36px]">
        <Button size="icon" variant="outline" onClick={onBack}>
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={onContinue}>
          {(customTailwindConfig?.length ?? 0) > 0 ||
          (customGlobalCss?.length ?? 0) > 0
            ? "Continue"
            : "Skip"}
        </Button>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold mt-10">Tailwind styles (optional)</h2>
        <p className="text-sm text-muted-foreground">
          Optionally extend shadcn/ui Tailwind theme to customize your component
        </p>

        <Tabs defaultValue="tailwind" className="w-full">
          <TabsList className="rounded-lg h-9">
            <TabsTrigger value="tailwind">tailwind.config.js</TabsTrigger>
            <TabsTrigger value="css">globals.css</TabsTrigger>
          </TabsList>

          <TabsContent value="tailwind">
            <EditorWrapper
              language="javascript"
              value={customTailwindConfig ?? ""}
              onChange={onTailwindConfigChange}
            />
          </TabsContent>

          <TabsContent value="css">
            <EditorWrapper
              language="css"
              value={customGlobalCss ?? ""}
              onChange={onGlobalCssChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}
