import { merge } from "lodash"
import { Config } from "tailwindcss"

function parseDataAttribute(variant: string) {
  const match = variant.match(/data-\[(.*?)=(.*?)\]/)
  if (!match) return null

  const [_, attr, value] = match
  return {
    attribute: attr,
    value: value?.replace(/['"]/g, ""),
  }
}

export function generateDataAttributeCSS(className: string, variants: string[]) {
  const dataVariants = variants.filter((v) => v.startsWith("data-["))
  if (!dataVariants.length) return ""

  const utility = className
  const cssRules: string[] = []

  dataVariants.forEach((variant) => {
    const parsed = parseDataAttribute(variant)
    if (!parsed) return

    // Generate the selector that references the original utility class
    const selector = `.data-\\[${parsed.attribute}\\=${parsed.value}\\]\\:${utility.replace("/", "\\/")}[data-${parsed.attribute}=${parsed.value}]`
    cssRules.push(`${selector} { @apply ${utility}; }`)
  })

  return cssRules.join("\n")
}
