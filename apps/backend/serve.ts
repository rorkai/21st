import { serve } from "bun"
import endent from "endent"
import tailwindcss from "tailwindcss"
import postcss from "postcss"
import { merge } from "lodash"

export const compileCSS = async ({
  jsx,
  baseTailwindConfig,
  customTailwindConfig,
  baseGlobalCss,
  customGlobalCss,
}: {
  jsx: string
  baseTailwindConfig: string
  customTailwindConfig?: string
  baseGlobalCss?: string
  customGlobalCss?: string
}) => {
  const configObject = customTailwindConfig
    ? new Function(
        "module",
        `
        const exports = {};
        ${customTailwindConfig};
        return module.exports;
      `,
      )({ exports: {} })
    : {}

  const baseConfig = new Function(
    "module",
    `
    const exports = {};
    ${baseTailwindConfig};
    return module.exports;
  `,
  )({ exports: {} })

  const globalCss = endent`
    ${baseGlobalCss}

    ${customGlobalCss}
  `

  const result = await postcss([
    tailwindcss({
      ...merge(baseConfig, configObject),
      content: [{ raw: jsx, extension: "tsx" }],
    }),
  ]).process(globalCss, {
    from: undefined,
  })
  return result.css
}

const server = serve({
  port: 80,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === "/compile-css" && req.method === "POST") {
      try {
        const {
          code,
          demoCode,
          baseTailwindConfig,
          baseGlobalCss,
          customTailwindConfig,
          customGlobalCss,
          dependencies,
        } = await req.json()

        const filteredCode = code
          .split("\n")
          .filter((line: string) => !line.trim().startsWith("import"))
          .join("\n")

        const filteredDemoCode = demoCode
          .split("\n")
          .filter((line: string) => !line.trim().startsWith("import"))
          .join("\n")

        const css = await compileCSS({
          jsx: `${filteredCode}\n${filteredDemoCode}\n${dependencies.join("\n")}`,
          baseTailwindConfig,
          customTailwindConfig,
          baseGlobalCss,
          customGlobalCss,
        })

        return Response.json({ css })
      } catch (error) {
        console.error("CSS compilation error:", error)
        return Response.json(
          { error: "Failed to compile CSS" },
          { status: 500 },
        )
      }
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`Server running at http://localhost:${server.port}`)
