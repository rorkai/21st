import { Component, User, Tag } from "@/types/global"
import { PromptType } from "@/types/global"

type PromptGenerationStatus = {
  status: "downloading" | "completed" | "error"
  prompt?: string
  error?: Error
}

export const generateAIPrompt = async (
  component: Component & { user: User } & { tags: Tag[] },
  promptType: PromptType,
  onStatusChange?: (status: PromptGenerationStatus) => void,
): Promise<PromptGenerationStatus> => {
  const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${component.user.username}/${component.component_slug}`
  const fetchFileContent = async (url: string) => {
    try {
      const response = await fetch(url)
      return await response.text()
    } catch (err) {
      console.error("Failed to fetch file content:", err)
      throw err
    }
  }

  try {
    onStatusChange?.({ status: "downloading" })

    const [mainCode, demoCode, tailwindConfig, globalCss] = await Promise.all([
      fetchFileContent(component.code),
      fetchFileContent(component.demo_code),
      component.tailwind_config_extension
        ? fetchFileContent(component.tailwind_config_extension)
        : Promise.resolve(null),
      component.global_css_extension
        ? fetchFileContent(component.global_css_extension)
        : Promise.resolve(null),
    ])

    let prompt = `# Task: Implement ${component.name} Component
You are a senior React developer tasked with implementing a reusable UI component. Follow these instructions carefully.

## Component Description
${component.description}

## Core Implementation
\`\`\`tsx
${mainCode}
\`\`\`

## Example Usage
\`\`\`tsx
${demoCode}
\`\`\`
`

    if (tailwindConfig) {
      prompt += `\n## Tailwind Configuration
\`\`\`js
${tailwindConfig}
\`\`\`
`
    }

    if (globalCss) {
      prompt += `\n## Global CSS
\`\`\`css
${globalCss}
\`\`\`
`
    }

    // Comment out Bolt-specific logic for now
    /*if (promptType === PROMPT_TYPES.BOLT) {
      // Bolt-specific prompt logic here
    }*/

    prompt += `\n## Implementation Guidelines
1. Analyze the component structure and identify all required dependencies
2. Note any external libraries or hooks being used
3. Pay attention to:
   - Component props and TypeScript types
   - State management patterns
   - Event handlers and user interactions
   - CSS/Tailwind class organization
   - Responsive design considerations

## Required Setup
1. React and Tailwind CSS must be properly configured
2. Install all necessary dependencies
3. Apply provided Tailwind config and global CSS if specified
4. Ensure proper TypeScript configuration

## Before Implementation
1. Review the component's data flow and state management
2. Identify any required context providers or hooks
3. Note any external dependencies or assets needed
4. Consider accessibility requirements

## Questions to Ask
1. What data/props will be passed to this component?
2. Are there any specific state management requirements?
3. Are there any required assets (images, icons, etc.)?
4. What is the expected responsive behavior?
5. Are there any specific accessibility requirements?

Please analyze the component and let me know what additional information you need before proceeding with the implementation.`

    const result = { status: "completed" as const, prompt }
    onStatusChange?.(result)
    return result
  } catch (error) {
    const errorStatus = {
      status: "error" as const,
      error: error instanceof Error ? error : new Error("Unknown error"),
    }
    onStatusChange?.(errorStatus)
    return errorStatus
  }
}
