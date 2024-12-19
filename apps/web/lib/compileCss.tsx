"use server"

import tailwindcss from "tailwindcss"
import postcss from "postcss"
import { defaultTailwindConfig, generateGlobalCss } from "./sandpack"
import { merge } from "lodash"

export const compileCSS = async (
  jsx: string,
  tailwindConfig?: string,
  globalCss?: string,
) => {
  const configObject = tailwindConfig
    ? new Function(
        "module",
        `
        const exports = {};
        ${tailwindConfig};
        return module.exports;
      `,
      )({ exports: {} })
    : {}

  const defaultConfig = new Function(
    "module",
    `
    const exports = {};
    ${defaultTailwindConfig};
    return module.exports;
  `,
  )({ exports: {} })

  const result = await postcss([
    tailwindcss({
      ...merge(defaultConfig, configObject),
      content: [{ raw: jsx, extension: "tsx" }],
    }),
  ]).process(
    generateGlobalCss([globalCss ?? ""]),
    {
      from: undefined,
    },
  )
  return result.css
}
