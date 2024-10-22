import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Codepen, FileTerminal, SunMoon } from "lucide-react"
import { Code } from "../ui/code"
import { Label } from "@radix-ui/react-label"
import { ParsedCodeData } from "./PublishComponentForm"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useRef, useState } from "react"

export const CodeGuidelinesAlert = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex justify-end items-center p-10 overflow-auto -z-10"
    >
      <div className="w-1/2 min-w-[400px]">
        <Alert className="border-none">
          <FileTerminal className="h-4 w-4" />
          <AlertTitle>Component code requirements</AlertTitle>
          <AlertDescription className="mt-2">
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Using dependencies:
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    You can use any dependencies from npm; we import them
                    automatically.
                  </li>
                  <li>
                    To import existing components from our registry, paste a
                    direct link to the component.
                  </li>
                </ul>
              </li>
              <li>
                React, TypeScript & Tailwind compatibility:
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    React client-side components are fully supported. Be sure to
                    import React:
                  </li>
                  <Code
                    display="block"
                    code={'"use client" \n\nimport * as React from "react"'}
                  />
                  <li>TypeScript is fully supported.</li>
                  <li>
                    Tailwind is fully supported along with custom Tailwind
                    styles from shadcn/ui.
                  </li>
                </ul>
              </li>
              <li>
                Next.js & server components compatibility:
                <ul className="list-disc pl-5 mt-1">
                  <li>Next.js is partially supported.</li>
                  <li>React server components are not supported yet.</li>
                  <li>
                    While we emulate browser-side Next.js functions, we do not
                    support Next.js completely. Make sure your code works in our
                    environment; if it doesn't, contact @serafimcloud on X
                  </li>
                </ul>
              </li>
              <li>
                Tailwind CSS:
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    Custom Tailwind styles are not yet supported in the preview.
                  </li>
                  <li>
                    If your component needs additional styles, specify them in
                    the description so users can install them themselves.
                  </li>
                </ul>
              </li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    </motion.div>
  )
}

export const DemoComponentGuidelinesAlert = ({
  mainComponentName,
  componentSlug,
}: {
  mainComponentName: string
  componentSlug: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3, delay: 0.3 }}
    className="fixed inset-0 flex justify-end items-center p-4 overflow-auto -z-10"
  >
    <div className="w-1/2 min-w-[400px]">
      <Alert className="border-none">
        <SunMoon className="h-4 w-4" />
        <AlertTitle>Demo code requirements</AlertTitle>
        <AlertDescription className="mt-2">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              How to import:
              <ul className="list-disc pl-5 mt-1">
                <li>
                  Import your component with curly braces from{" "}
                  <Code code="@/components/ui" language="pseudo" /> path:
                  <Code
                    display="block"
                    code={`import { ${mainComponentName ?? "MyComponent"} } from "@/components/ui/${componentSlug}"`}
                  />
                </li>
                <li>
                  Import any existing component from our registry by its slug:
                  <Code
                    display="block"
                    code={`import { Button } from "@/components/ui/button"`}
                  />
                  We'll ask you to specify the registry URL of the component later
                </li>
                <li>
                  You can use any dependencies from npm, e.g.:
                  <Code
                    display="block"
                    code={`import { LucideIcon } from "lucide-react"`}
                  />
                </li>
              </ul>
            </li>
            <li>
              Demo structure:
              <ul className="list-disc pl-5 mt-1">
                <li>
                  The demo code should demonstrate the usage and appearance of
                  the component.
                </li>
                <li>
                  You can create multiple component demo variants. Export all
                  demo variants you want to display on the page using curly
                  braces:
                  <Code
                    display="block"
                    code={"export { DemoVariant1, DemoVariant2 }"}
                  />
                </li>
                <li>
                  Be sure to import React if you use it in the demo code:
                  <Code
                    display="block"
                    code={'import * as React from "react"'}
                  />
                </li>
              </ul>
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  </motion.div>
)

const InputUnknownDependency = ({
  slug,
  onDependencyResolved,
}: {
  slug: string
  onDependencyResolved: (username: string, slug: string) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const value = inputRef.current?.value
    const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL!).host
    if (!value?.includes(appHost)) {
      setError("Please enter a valid URL")
      return
    }
    const [username, componentSlug] = value
      .replace(`${appHost}/`, "")
      .replace("https://", "")
      .split("/")

    if (!username || !componentSlug) {
      setError("Couldn't resolve the username")
      return
    }
    onDependencyResolved(username, componentSlug)
  }

  return (
    <div className="flex flex-col">
      <Label className="text-sm">
        Enter the link to <b>{slug}</b>
      </Label>
      <Input
        ref={inputRef}
        placeholder='e.g. "https://21st.dev/shadcn/button"'
        className="mt-1 w-full"
      />
      <Label className="text-sm text-red-500">{error}</Label>
      <Button className="mt-2" onClick={handleSave}>
        Save
      </Button>
    </div>
  )
}

export const ResolveUnknownDependenciesCard = ({
  unknownDependencies,
  onDependencyResolved,
}: {
  unknownDependencies: string[]
  onDependencyResolved: (username: string, slug: string) => void
}) => {
  return (
    <div className="w-full">
      <Alert className="my-2">
        <Codepen className="h-4 w-4" />
        <AlertTitle>Unknown dependencies detected</AlertTitle>
        <AlertDescription>
          To use another registry component within your component:
          <br />
          1. Find it on 21st.dev, or publish it if it's not there
          <br />
          2. Paste the link here
        </AlertDescription>
      </Alert>
      {unknownDependencies.map((slug, index) => (
        <div key={slug} className={`flex flex-col ${index > 0 ? "mt-2" : ""}`}>
          <InputUnknownDependency
            slug={slug}
            onDependencyResolved={onDependencyResolved}
          />
        </div>
      ))}
    </div>
  )
}

export const DebugInfoDisplay = ({
  componentNames,
  demoComponentNames,
  dependencies,
  demoDependencies,
}: ParsedCodeData & {
  unknownDependencies: string[]
}) => (
  <>
    <div className="w-full">
      <Label>Component names</Label>
      <Textarea
        value={componentNames?.join(", ")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
    <div className="w-full">
      <Label>Demo component name</Label>
      <Input
        value={demoComponentNames?.join(", ")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
    <div className="w-full">
      <Label>Component dependencies</Label>
      <Textarea
        value={Object.entries(dependencies ?? {})
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
    <div className="w-full">
      <Label>Demo dependencies</Label>
      <Textarea
        value={Object.entries(demoDependencies ?? {})
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
  </>
)
