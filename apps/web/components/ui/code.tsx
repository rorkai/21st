import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CSSProperties } from "react"

const codeVariants = cva("font-mono rounded-md", {
  variants: {
    display: {
      inline: "inline-flex bg-secondary py-0 px-1",
      block: "block bg-secondary p-2 mt-2 mb-4",
    },
    theme: {
      dark: {
        default: vscDarkPlus,
      },
      light: {
        default: vscDarkPlus,
      },
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

interface CodeProps
  extends React.HTMLAttributes<HTMLPreElement>,
    VariantProps<typeof codeVariants> {
  code: string
  fontSize?: "xs" | "sm" | "md" | "lg"
  language?: string
  highlightStyles?: { [key: string]: CSSProperties }
}

const Code = ({
  code,
  language = "jsx",
  display,
  fontSize,
  highlightStyles = vscDarkPlus,
  className,
}: CodeProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={highlightStyles}
      customStyle={{
        background: "transparent",
        padding: 0,
        margin: 0,
      }}
      PreTag={({ children }) => (
        <pre className={cn(codeVariants({ display, fontSize }), className)}>
          {children}
        </pre>
      )}
    >
      {code}
    </SyntaxHighlighter>
  )
}
Code.displayName = "Code"

export { Code }
