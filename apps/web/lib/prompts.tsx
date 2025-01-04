import endent from "endent"
import { PROMPT_TYPES } from "@/types/global"
import { PromptType } from "@/types/global"
import { uniq } from "lodash"
import { Brain, Sparkles } from "lucide-react"
import { Icons } from "@/components/icons"

interface V0TemplateFile {
  path: string
  type: string
  target?: string
  content: string
}

interface PromptOptionBase {
  type: "option"
  id: string
  label: string
  description: string
  action: "copy" | "open"
  icon: JSX.Element
}

interface PromptSeparator {
  type: "separator"
  id: string
}

type PromptOption = PromptOptionBase | PromptSeparator

export const promptOptions: PromptOption[] = [
  {
    type: "option",
    id: PROMPT_TYPES.BASIC,
    label: "Basic",
    description: "Standard prompt for AI code editors",
    action: "copy",
    icon: (
      <Sparkles
        size={16}
        className="mr-2 min-h-[16px] min-w-[16px] max-h-[16px] max-w-[16px]"
      />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.EXTENDED,
    label: "Extended",
    description: "Extended prompt for complex components",
    action: "copy",
    icon: (
      <Brain
        size={16}
        className="mr-2 min-h-[16px] min-w-[16px] max-h-[16px] max-w-[16px]"
      />
    ),
  },
  {
    id: "separator1",
    type: "separator",
  },
  {
    type: "option",
    id: PROMPT_TYPES.V0,
    label: "v0 by Vercel",
    description: "Optimized for v0.dev",
    action: "copy",
    icon: (
      <Icons.v0Logo className="mr-2 min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.LOVABLE,
    label: "Lovable",
    description: "Optimized for Lovable.dev",
    action: "copy",
    icon: (
      <Icons.lovableLogo className="mr-2 min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.BOLT,
    label: "Bolt.new",
    description: "Optimized for Bolt.new",
    action: "copy",
    icon: (
      <Icons.boltLogo className="mr-2 min-h-[22px] min-w-[22px] max-h-[22px] max-w-[22px]" />
    ),
  },
  {
    id: "separator2",
    type: "separator",
  },
  {
    type: "option",
    id: "v0-open",
    label: "Open in v0.dev",
    description: "Open component in v0.dev",
    action: "open",
    icon: (
      <Icons.v0Logo className="mr-2 min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
]

export type { PromptOption, PromptOptionBase }

export const getComponentInstallPrompt = ({
  promptType,
  codeFileName,
  demoCodeFileName,
  code,
  demoCode,
  registryDependencies,
  npmDependencies,
  npmDependenciesOfRegistryDependencies,
  tailwindConfig,
  globalCss,
}: {
  promptType: PromptType
  codeFileName: string
  demoCodeFileName: string
  code: string
  demoCode: string
  npmDependencies: Record<string, string>
  registryDependencies: Record<string, string>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  tailwindConfig?: string
  globalCss?: string
}) => {
  const componentFileName = codeFileName.split("/").slice(-1)[0]
  const componentDemoFileName = demoCodeFileName.split("/").slice(-1)[0]

  let prompt = ""
  if (promptType === PROMPT_TYPES.EXTENDED) {
    prompt +=
      endent`
        You are given a task to integrate an existing React component in the codebase

        The codebase should support:
        - shadcn project structure  
        - Tailwind CSS
        - Typescript

        If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

        Determine the default path for components and styles. 
        If default path for components is not /components/ui, provide instructions on why it's important to create this folder
      ` + "\n"
  }

  prompt +=
    "Copy-paste this component to /components/ui folder:\n" +
    endent`
      ${componentFileName}
      ${code}

      ${componentDemoFileName}
      ${demoCode}
    ` +
    "\n"

  if (Object.keys(registryDependencies || {}).length > 0) {
    prompt +=
      "\n" +
      endent`
        Copy-paste these files for dependencies:
        ${Object.entries(registryDependencies)
          .map(
            ([fileName, fileContent]) => endent`
            ${fileName}
            ${fileContent}
          `,
          )
          .join("\n")}
      ` +
      "\n"
  }

  const allDependencies = uniq([
    ...Object.keys(npmDependencies),
    ...Object.keys(npmDependenciesOfRegistryDependencies),
  ])
  if (allDependencies.length) {
    prompt +=
      "\n" +
      endent`
        Install NPM dependencies:
        ${allDependencies.join(", ")}
      ` +
      "\n"
  }

  if (tailwindConfig) {
    prompt +=
      "\n" +
      endent`
        Extend existing tailwind.config.js with this code:
        ${tailwindConfig}
      ` +
      "\n"
  }

  if (globalCss) {
    prompt +=
      "\n" +
      endent`
        Extend existing globals.css with this code:
        ${globalCss}
      ` +
      "\n"
  }

  // Comment out Bolt-specific logic for now
  /*if (promptType === PROMPT_TYPES.BOLT) {
      // Bolt-specific prompt logic here
    }*/

  if (promptType === PROMPT_TYPES.EXTENDED) {
    prompt +=
      "\n" +
      endent`

        Implementation Guidelines
        1. Analyze the component structure and identify all required dependencies
        2. Review the component's argumens and state
        3. Identify any required context providers or hooks and install them
        4. Questions to Ask
        - What data/props will be passed to this component?
        - Are there any specific state management requirements?
        - Are there any required assets (images, icons, etc.)?
        - What is the expected responsive behavior?
        - What is the best place to use this component in the app?

       Steps to integrate
        0. Copy paste all the code above in the correct directories
        1. Install external dependencies
        2. Fill image assets with Unsplash stock images you know exist
        3. Use lucide-react icons for svgs or logos if component requires them
      ` +
      "\n"
  }

  prompt +=
    "\n" +
    endent`
      Remember: Do not change the component's code unless it's required to integrate or the user asks you to.
    `

  return prompt
}

export const createV0Template = ({
  componentName,
  code,
  demoCode,
  registryDependencies,
  npmDependencies,
  npmDependenciesOfRegistryDependencies,
  tailwindConfig,
  globalCss,
}: {
  componentName: string
  code: string
  demoCode: string
  registryDependencies: Record<string, string>
  npmDependencies: Record<string, string>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  tailwindConfig?: string
  globalCss?: string
}) => {
  const normalizedName = componentName.toLowerCase().replace(/\s+/g, "-")

  const template = {
    name: normalizedName,
    type: "registry:block",
    title: componentName,
    description: "A component from 21st.dev registry",
    meta: {
      env: [] as { name: string; url: string }[],
    },
    files: [
      {
        path: "app/page.tsx",
        type: "registry:page",
        target: "app/page.tsx",
        content: `
import { ${componentName} } from "@/components/ui/${normalizedName}"

export default function Page() {
  return <${componentName} />
}
`,
      },
      {
        path: "app/layout.tsx",
        type: "registry:page",
        target: "app/layout.tsx",
        content: `
import "@/app/globals.css"
import * as React from "react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      },
      {
        path: `components/ui/${normalizedName}.tsx`,
        type: "registry:component",
        content: code,
      },
      {
        path: `components/ui/${normalizedName}.demo.tsx`,
        type: "registry:component",
        content: demoCode,
      },
    ] as V0TemplateFile[],
    dependencies: {
      ...npmDependencies,
      ...npmDependenciesOfRegistryDependencies,
    },
  }

  if (Object.keys(registryDependencies).length > 0) {
    Object.entries(registryDependencies).forEach(([path, content]) => {
      const fileName = path.split("/").pop()
      if (fileName && !fileName.startsWith(normalizedName)) {
        template.files.push({
          path: `components/ui/${fileName}`,
          type: "registry:component",
          content,
        })
      }
    })
  }

  if (tailwindConfig) {
    template.files.push({
      path: "tailwind.config.js",
      type: "registry:config",
      target: "tailwind.config.js",
      content: tailwindConfig,
    })
  }

  if (globalCss) {
    template.files.push({
      path: "app/globals.css",
      type: "registry:page",
      target: "app/globals.css",
      content: globalCss,
    })
  }

  return template
}
