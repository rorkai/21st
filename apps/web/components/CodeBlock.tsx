import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

export const CodeBlock = ({ code }: { code: string }) => {
  return (
    <pre className="bg-secondary p-2 rounded-md mt-2 mb-4"> 
      <SyntaxHighlighter
        language="jsx"
        style={vscDarkPlus}
        customStyle={{
          background: "transparent",
          padding: 0,
          margin: 0,
          fontSize: "12px",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </pre>
  )
}