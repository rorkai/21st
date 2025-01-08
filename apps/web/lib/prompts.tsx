import endent from "endent"
import { PROMPT_TYPES } from "@/types/global"
import { PromptType } from "@/types/global"
import { uniq } from "lodash"
import { Brain, Sparkles } from "lucide-react"
import { Icons } from "@/components/icons"

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
        className="min-h-[16px] min-w-[16px] max-h-[16px] max-w-[16px]"
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
        className="min-h-[16px] min-w-[16px] max-h-[16px] max-w-[16px]"
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
      <Icons.v0Logo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.LOVABLE,
    label: "Lovable",
    description: "Optimized for Lovable.dev",
    action: "copy",
    icon: (
      <Icons.lovableLogo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.BOLT,
    label: "Bolt.new",
    description: "Optimized for Bolt.new",
    action: "copy",
    icon: (
      <Icons.boltLogo className="min-h-[22px] min-w-[22px] max-h-[22px] max-w-[22px]" />
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
      <Icons.v0Logo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
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
      \`\`\`tsx
      ${componentFileName}
      ${code}

      ${componentDemoFileName}
      ${demoCode}
      \`\`\`
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
            \`\`\`tsx
            ${fileName}
            ${fileContent}
            \`\`\`
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
        \`\`\`bash
        ${allDependencies.join(", ")}
        \`\`\`
      ` +
      "\n"
  }

  if (tailwindConfig) {
    prompt +=
      "\n" +
      endent`
        Extend existing tailwind.config.js with this code:
        \`\`\`js
        ${tailwindConfig}
        \`\`\`
      ` +
      "\n"
  }

  if (globalCss) {
    prompt +=
      "\n" +
      endent`
        Extend existing globals.css with this code:
        \`\`\`css
        ${globalCss}
        \`\`\`
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
      IMPORTANT: Create all mentioned files in full, without abbreviations. Do not use placeholders like “insert the rest of the code here” – output every line of code exactly as it is, so it can be copied and pasted directly into the project.
    `

  return prompt
}

export const formatV0Prompt = (componentName: string, code: string) => {
  const escapedCode = code.replace(/`/g, "\\`")

  return endent
    `Create a new project that uses this ${componentName} component:

    \`\`\`tsx
    ${escapedCode}
    \`\`\`

    Ask the user for project description and instructions on how to integrate the component.
    `
}
