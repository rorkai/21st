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

    ${customGlobalCss || ""}
  `

  const mergedConfig = merge(baseConfig, configObject)

  const result = await postcss([
    tailwindcss({
      ...mergedConfig,
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
    const origin = req.headers.get("origin")
    const allowedOrigins = ["http://localhost:3000", "https://21st.dev"]
    const headers = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin ?? "") ? origin ?? "" : "",
      "Access-Control-Allow-Methods": "POST, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type",
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { headers })
    }

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

        const filteredDependencies = dependencies.map((dep: string) => 
          dep.split("\n")
            .filter((line: string) => !line.trim().startsWith("import"))
            .join("\n")
        )

        const css = await compileCSS({
          jsx: `${filteredCode}\n${filteredDemoCode}\n${filteredDependencies.join("\n")}`,
          baseTailwindConfig,
          customTailwindConfig,
          baseGlobalCss,
          customGlobalCss,
        })

        console.log("css", css)

        return Response.json({ css }, { headers })
      } catch (error) {
        console.error("CSS compilation error:", error)
        return Response.json(
          { error: "Failed to compile CSS" },
          { status: 500, headers }
        )
      }
    }

    return new Response("Not Found", { status: 404, headers })
  },
})

console.log(`Server running at http://localhost:${server.port}`)
