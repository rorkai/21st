import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Code } from "@/components/ui/code"
import { Label } from "@radix-ui/react-label"
import { ParsedCodeData } from "../publish-layout"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { FormEvent } from "react"
import { cn } from "@/lib/utils"

const pageStyles = {
  container: "flex justify-end items-start w-full h-full p-6",
  wrapper: cn(
    "bg-background/95",
    "rounded-xl border border-border/40",
    "dark:bg-background/95 dark:border-border/30",
    "relative",
    "w-full",
    "flex flex-col",
    "max-h-[calc(100vh-10rem)]",
    "h-fit",
  ),
  header: cn(
    "p-6 pb-4",
    "border-b border-border/40 dark:border-border/30",
    "bg-background",
    "rounded-t-xl",
    "flex flex-col gap-1.5",
  ),
  headerTitle: cn(
    "text-sm font-medium",
    "text-muted-foreground",
    "uppercase tracking-wider",
  ),
  headerMain: cn(
    "text-2xl font-semibold tracking-tight",
    "text-foreground",
    "flex items-center gap-2",
  ),
  icon: cn("w-6 h-6", "text-foreground/80 dark:text-foreground/90"),
  content: cn(
    "p-6 pt-4",
    "space-y-5 leading-relaxed",
    "text-[0.95rem]",
    "text-foreground/90 dark:text-foreground/85",
    "overflow-y-auto",
  ),
  list: {
    container: "space-y-4 mt-2",
    ordered: "list-decimal pl-5 space-y-3.5",
    unordered: cn(
      "list-disc pl-5 mt-2 space-y-2.5",
      "marker:text-foreground/70 dark:marker:text-foreground/60",
    ),
    item: "pl-1.5",
  },
  code: {
    block: cn(
      "my-2.5 text-[0.9rem]",
      "bg-secondary/50 dark:bg-secondary/40",
      "border border-border/50",
      "rounded-md p-3",
      "text-foreground/90 dark:text-foreground/90",
    ),
    inline: cn(
      "text-[0.9rem] px-1.5 py-0.5 rounded",
      "bg-secondary/50 dark:bg-secondary/40",
      "border border-border/50",
      "text-foreground/90 dark:text-foreground/90",
    ),
  },
  form: {
    field: "flex flex-col space-y-1.5",
    label: cn(
      "text-sm font-medium",
      "text-foreground/80 dark:text-foreground/90",
    ),
    error: cn(
      "text-sm font-medium",
      "text-destructive dark:text-destructive/90",
    ),
  },
  actions: {
    container: "absolute flex gap-2 bottom-3 right-3 z-50 h-[36px]",
  },
}

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
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 flex-1 overflow-y-auto">
      <div className="space-y-4">
        {unknownDependencies.map(({ slugWithUsername, registry }) => (
          <div key={slugWithUsername} className="space-y-2">
            <Label>
              Enter the link to{" "}
              <span className="font-semibold">
                {registry ? `${registry}/` : ""}
                {slugWithUsername}
              </span>
            </Label>
            <Input
              name={slugWithUsername}
              placeholder='e.g. "https://21st.dev/shadcn/button"'
              className="w-full"
            />
            {errors[slugWithUsername] && (
              <p className="text-sm text-destructive">
                {errors[slugWithUsername]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}

export const CodeGuidelinesAlert = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={pageStyles.container}
    >
      <div className={pageStyles.wrapper}>
        <div className={pageStyles.header}>
          <span className={pageStyles.headerTitle}>Development Guide</span>
          <h2 className={pageStyles.headerMain}>Component Code</h2>
        </div>
        <div className={pageStyles.content}>
          <ol className={pageStyles.list.ordered}>
            <li>
              Using dependencies:
              <ul className={pageStyles.list.unordered}>
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
              <ul className={pageStyles.list.unordered}>
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
              <ul className={pageStyles.list.unordered}>
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
        </div>
      </div>
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
    transition={{ duration: 0.3 }}
    className={pageStyles.container}
  >
    <div className={pageStyles.wrapper}>
      <div className={pageStyles.header}>
        <span className={pageStyles.headerTitle}>Preview Guide</span>
        <h2 className={pageStyles.headerMain}>Demo Code</h2>
      </div>
      <div className={pageStyles.content}>
        <ol className={pageStyles.list.ordered}>
          <li>
            How to import:
            <ul className={pageStyles.list.unordered}>
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
            <ul className={pageStyles.list.unordered}>
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
      </div>
    </div>
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

export const TailwindGuidelinesAlert = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={pageStyles.container}
    >
      <div className={pageStyles.wrapper}>
        <div className={pageStyles.header}>
          <span className={pageStyles.headerTitle}>Configuration Guide</span>
          <h2 className={pageStyles.headerMain}>Tailwind Settings</h2>
        </div>
        <div className={pageStyles.content}>
          <ol className={pageStyles.list.ordered}>
            <li>
              Extending Tailwind configuration:
              <ul className={pageStyles.list.unordered}>
                <li>Use shadcn/ui format to extend the configuration</li>
                <li>Add only the styles that your component needs</li>
              </ul>
            </li>
            <li>
              Configuration example:
              <Code
                display="block"
                code={`/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
}`}
              />
            </li>
          </ol>
        </div>
      </div>
    </motion.div>
  )
}

export const GlobalStylesGuidelinesAlert = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={pageStyles.container}
    >
      <div className={pageStyles.wrapper}>
        <div className={pageStyles.header}>
          <span className={pageStyles.headerTitle}>Styling Guide</span>
          <h2 className={pageStyles.headerMain}>Global CSS</h2>
        </div>
        <div className={pageStyles.content}>
          <ol className={pageStyles.list.ordered}>
            <li>
              CSS Variables:
              <ul className={pageStyles.list.unordered}>
                <li>Define CSS variables in :root for light theme</li>
                <li>Use .dark class for dark theme variables</li>
              </ul>
            </li>
            <li>
              globals.css example:
              <Code
                display="block"
                code={`@layer base {
  :root {
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}`}
              />
            </li>
          </ol>
        </div>
      </div>
    </motion.div>
  )
}
