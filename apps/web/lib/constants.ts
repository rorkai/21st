export const PROMPT_TYPES = {
  BASIC: "basic",
  V0: "v0",
  LOVABLE: "lovable",
  BOLT: "bolt",
} as const

export type PromptType = (typeof PROMPT_TYPES)[keyof typeof PROMPT_TYPES]
