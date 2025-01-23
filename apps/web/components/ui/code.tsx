"use client"

import {
  Prism as SyntaxHighlighter,
  SyntaxHighlighterProps,
} from "react-syntax-highlighter"
import * as highlightThemes from "react-syntax-highlighter/dist/esm/styles/prism"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useState } from "react"

const codeVariants = cva(
  "font-mono rounded-md cursor-pointer overflow-auto transition-all duration-200 relative",
  {
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
  },
)

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
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyClick = async () => {
    if (isCopied) return
    await navigator.clipboard.writeText(code)
    setIsCopied(true)
    toast.success("Copied to clipboard", {
      duration: 1500,
      className: "select-none",
    })

    setTimeout(() => {
      setIsCopied(false)
    }, 1000)
  }

  return (
    <SyntaxHighlighter
      language={language}
      style={highlightThemes[highlightTheme]}
      PreTag={({ children }) => (
        <pre
          style={highlightThemes[highlightTheme]}
          className={cn(
            codeVariants({ fontSize, display }),
            className,
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
            "before:absolute before:inset-0 before:rounded-md before:pointer-events-none",
            isCopied &&
              "before:bg-emerald-400/5 before:border before:border-emerald-400/20 before:animate-copy-success",
          )}
          onClick={handleCopyClick}
          role="button"
          tabIndex={0}
          aria-label="Click to copy code"
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
