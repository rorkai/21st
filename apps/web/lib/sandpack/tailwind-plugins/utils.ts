import { Config } from "tailwindcss"
import { tailwindConfig as baseTailwindConfig } from "./base"
import { merge } from "lodash"

function getNestedValue(obj: any, segments: string[]): any {
  return segments.reduce((acc, segment) => acc?.[segment], obj)
}

// Generalized theme function to handle merged Tailwind configs and extensions
export const theme = (path: string, configExtensions: Config[] = []) => {
  // First merge base config with any extensions
  const mergedConfig = merge(baseTailwindConfig, ...configExtensions)

  const segments = path.split(".")

  const themeExtendsValue = segments.reduce((acc, segment) => {
    const value = acc?.[segment]
    // If the value is a function, execute it with a basic theme helper
    return typeof value === "function"
      ? value({
          theme: (path: string) =>
            getNestedValue(mergedConfig.theme, path.split(".")),
        })
      : value
  }, mergedConfig.theme?.extend)

  const themeValue = getNestedValue(mergedConfig.theme, segments)

  // Get value from merged config
  const value = themeExtendsValue ?? themeValue

  return value
}

export const createPluginCSSGenerator = ({
  pluginConfig = {} as Config,
  generatePluginGlobalsCSS,
}: {
  pluginConfig?: Config
  generatePluginGlobalsCSS: (themeHelper: ReturnType<typeof theme>) => string
}) => {
  return (configExtensions: Config[]) => {
    const themeFn = (path: string) =>
      theme(path, [pluginConfig, ...configExtensions])
    return generatePluginGlobalsCSS(themeFn)
  }
}

export const generateMatchedUtilities = (
  patterns: Record<string, (value: any) => Record<string, any>>,
  themeKey: string,
  filterDefault = false,
) => {
  const values = theme(themeKey) || {}
  const filteredValues = filterDefault
    ? Object.fromEntries(
        Object.entries(values).filter(([key]) => key !== "DEFAULT"),
      )
    : values

  return Object.entries(filteredValues).flatMap(([key, value]) =>
    Object.entries(patterns).map(([pattern, generator]) => {
      const props = generator(value)
      return `.${pattern}-${key} { ${Object.entries(props)
        .map(([prop, val]) => `${prop}: ${val};`)
        .join(" ")} }`
    }),
  )
}

interface TailwindConfigFunction extends Function {
  (args: { theme: (path: string) => any }): any
  toJSON(): string
}

export function createTailwindConfigFunction(
  fn: (args: { theme: (path: string) => any }) => any,
): TailwindConfigFunction {
  const configFn = fn as TailwindConfigFunction
  configFn.toJSON = function () {
    const fnStr = fn
      .toString()
      .replace(/\n\s+/g, " ") // Replace newlines and extra spaces with single space
      .replace(/\s*{\s*/g, "{ ") // Clean up curly braces
      .replace(/\s*}\s*/g, " }") // Clean up closing braces
      .trim()
    return fnStr
  }
  return configFn
}

export const stringifyTailwindConfig = (config: any): string => {
  // Step 1: Mark function strings with a special prefix
  const FUNCTION_MARKER = "__FN__"

  const processed = JSON.stringify(
    config,
    (key, value) => {
      if (typeof value === "string" && value.includes("({")) {
        return `${FUNCTION_MARKER}${value}${FUNCTION_MARKER}`
      }
      return value
    },
    2,
  )

  // Step 2: Remove quotes and marker from function strings
  return processed
    .replace(new RegExp(`"${FUNCTION_MARKER}`, "g"), "")
    .replace(new RegExp(`${FUNCTION_MARKER}"`, "g"), "")
    .replace(/\\"/g, '"')
}