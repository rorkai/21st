import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Codepen, FileTerminal, SunMoon, ChevronLeft } from "lucide-react"
import { Code } from "../ui/code"
import { Label } from "@radix-ui/react-label"
import { ParsedCodeData } from "./PublishComponentForm"
import { Textarea } from "../ui/textarea"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useState } from "react"
import Link from "next/link"
import { FormEvent } from "react"

export const ResolveUnknownDependenciesAlertForm = ({
  unknownDependencies,
  onDependenciesResolved,
  onBack,
}: {
  unknownDependencies: {
    slugWithUsername: string
    registry: string
    isDemoDependency: boolean
  }[]
  onDependenciesResolved: (
    // eslint-disable-next-line no-unused-vars
    deps: {
      username: string
      slug: string
      registry: string
      isDemoDependency: boolean
    }[],
  ) => void
  onBack: () => void
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const resolvedDependencies: {
      username: string
      slug: string
      registry: string
      isDemoDependency: boolean
    }[] = []
    const newErrors: Record<string, string> = {}

    unknownDependencies.forEach(
      ({ slugWithUsername, registry, isDemoDependency }) => {
        const value = formData.get(slugWithUsername) as string
        const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL!).host

        if (!value?.includes(appHost)) {
          newErrors[slugWithUsername] = "Please enter a valid URL"
          return
        }

        const [username, slug] = value
          .replace(`${appHost}/`, "")
          .replace("https://", "")
          .split("/")

        if (!username || !slug) {
          newErrors[slugWithUsername] = "Couldn't resolve the username"
          return
        }

        resolvedDependencies.push({
          username,
          slug,
          registry,
          isDemoDependency,
        })
      },
    )

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onDependenciesResolved(resolvedDependencies)
    }
  }

  return (
    <div className="w-full relative h-[70vh]">
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
      <form onSubmit={handleSubmit}>
        {unknownDependencies.map(({ slugWithUsername, registry }, index) => (
          <div
            key={slugWithUsername}
            className={`flex flex-col ${index > 0 ? "mt-4" : ""}`}
          >
            <Label className="text-sm">
              Enter the link to{" "}
              <span className="font-semibold">
                {registry ? `${registry}/` : ""}
                {slugWithUsername}
              </span>
            </Label>
            <Input
              name={slugWithUsername}
              placeholder='e.g. "https://21st.dev/shadcn/button"'
              className="mt-1 w-full"
            />
            {errors[slugWithUsername] && (
              <Label className="text-sm text-red-500">
                {errors[slugWithUsername]}
              </Label>
            )}
          </div>
        ))}
        <div className="absolute flex gap-2 bottom-2 right-2 z-50 h-[36px]">
          <Button size="icon" variant="outline" onClick={onBack} type="button">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button type="submit" size="sm">
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}

export const CodeGuidelinesAlert = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end items-center px-4 overflow-auto"
    >
      <Alert className="w-full border-none">
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
                <li>TypeScript is fully supported</li>
                <li>Tailwind is fully supported</li>
                <li>
                  By default, we use default{" "}
                  <Code code="tailwind.config.ts" language="pseudo" /> and{" "}
                  <Code code="global.css" language="pseudo" /> from{" "}
                  <Code code="shadcn/ui" language="pseudo" /> – you can extend
                  them later
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
                  environment; if it doesn't, contact{" "}
                  <Link
                    className="font-semibold"
                    href="https://x.com/serafimcloud"
                    target="_blank"
                  >
                    @serafimcloud
                  </Link>{" "}
                  on X
                </li>
              </ul>
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}

export const DemoComponentGuidelinesAlert = ({
  mainComponentName,
  componentSlug,
  registryToPublish,
}: {
  mainComponentName: string
  componentSlug: string
  registryToPublish: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3, delay: 0.3 }}
    className="flex justify-end items-center px-4 overflow-auto"
  >
    <Alert className="w-full border-none">
      <SunMoon className="h-4 w-4" />
      <AlertTitle>Demo code requirements</AlertTitle>
      <AlertDescription className="mt-2">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            How to import:
            <ul className="list-disc pl-5 mt-1">
              <li>
                Import your component with curly braces from{" "}
                <Code
                  code={`@/components/${registryToPublish}`}
                  language="pseudo"
                />{" "}
                path:
                <Code
                  display="block"
                  code={`import { ${mainComponentName ?? "MyComponent"} } from "@/components/${registryToPublish}/${componentSlug}"`}
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
                The demo code should demonstrate the usage and appearance of the
                component.
              </li>
              <li>
                You can create multiple component demo variants. Export all demo
                variants you want to display on the page using curly braces:
                <Code
                  display="block"
                  code={"export { DemoVariant1, DemoVariant2 }"}
                />
              </li>
              <li>
                Be sure to import React if you use it in the demo code:
                <Code display="block" code={'import * as React from "react"'} />
              </li>
            </ul>
          </li>
        </ol>
      </AlertDescription>
    </Alert>
  </motion.div>
)

export const DebugInfoDisplay = ({
  componentNames,
  demoComponentNames,
  dependencies,
  demoDependencies,
}: ParsedCodeData & {
  unknownDependencies: { slugWithUsername: string; isDemoDependency: boolean }[]
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
