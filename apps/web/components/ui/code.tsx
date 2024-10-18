import {
  Prism as SyntaxHighlighter,
  SyntaxHighlighterProps,
} from "react-syntax-highlighter"
import * as highlightThemes from "react-syntax-highlighter/dist/esm/styles/prism"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const codeVariants = cva("font-mono rounded-md", {
  variants: {
    display: {
      inline: "inline-flex bg-secondary py-0 px-1",
      block: "block bg-secondary p-2 mt-2 mb-4",
    },
    fontSize: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    display: "inline",
    fontSize: "xs",
  },
})

type HighlightThemeKey = keyof typeof highlightThemes

interface CodeProps
  extends React.HTMLAttributes<HTMLPreElement>,
    VariantProps<typeof codeVariants> {
  code: string
  fontSize?: "xs" | "sm" | "md" | "lg"
  language?: SyntaxHighlighterProps["language"] | "pseudo"
  highlightTheme?: HighlightThemeKey
}

const Code = ({
  code,
  language = "jsx",
  display,
  fontSize,
  highlightTheme = "darcula",
  className,
}: CodeProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={highlightThemes[highlightTheme]}
      PreTag={({ children }) => (
        <pre
          style={highlightThemes[highlightTheme]}
          className={cn(codeVariants({ fontSize, display }), className)}
        >
          {children}
        </pre>
      )}
      CodeTag={({ children }) => <code>{children}</code>}
    >
      {code}
    </SyntaxHighlighter>
  )
}
Code.displayName = "Code"

export { Code }
