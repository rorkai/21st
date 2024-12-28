import { serve } from "bun"
import endent from "endent"
import tailwindcss from "tailwindcss"
import postcss from "postcss"
import * as ts from "typescript"
import { merge } from "lodash"
import { exec } from "child_process"
import fs from "fs/promises"
import path from "path"
import os from "os"

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
  const globalCss = endent`
    ${baseGlobalCss}
    ${customGlobalCss ?? ""}
  `

  const baseConfigObj = Function(
    "require",
    "module",
    `
    module.exports = ${baseTailwindConfig};
    return module.exports;
  `,
  )(require, { exports: {} })

  if (customTailwindConfig) {
    const transpiledCustomTailwindConfig = ts.transpileModule(
      customTailwindConfig,
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2015,
          module: ts.ModuleKind.CommonJS,
          removeComments: true,
        },
      },
    ).outputText

    const matches = transpiledCustomTailwindConfig.match(
      /([\s\S]*?)(module\.exports\s*=\s*({[\s\S]*?});)([\s\S]*)/,
    )

    if (matches) {
      const [_, beforeConfig, __, configObject, afterConfig] = matches

      const customConfigObj = Function(
        "require",
        "module",
        `
        ${beforeConfig || ""}
        module.exports = ${configObject};
        ${afterConfig || ""}
        return module.exports;
      `,
      )(require, { exports: {} })

      const mergedConfig = merge(baseConfigObj, customConfigObj)

      // Custom serialization to handle functions
      let serializedConfig = JSON.stringify(
        mergedConfig,
        (key, value) => {
          if (typeof value === "function") {
            return value.name || value.toString()
          }
          return value
        },
        2,
      )

      // Match any string that looks like a function, including escaped ones
      serializedConfig = serializedConfig.replace(
        /"(function[\s\S]*?\{[\s\S]*?\}|[\w]+)"/g,
        (match, functionContent) => {
          // If it's a function definition (starts with 'function'), return it unquoted and unescaped
          if (functionContent.startsWith("function")) {
            // Unescape the function content
            return functionContent
              .replace(/\\"/g, '"') // Replace \" with "
              .replace(/\\n/g, "\n") // Replace \n with newline
              .replace(/\\\\/g, "\\") // Replace \\ with \
          }
          // For named functions in plugins array
          if (
            mergedConfig.plugins?.some(
              (plugin: Function) => plugin.name === functionContent,
            )
          ) {
            return functionContent
          }
          // Keep quotes for non-functions
          return `"${functionContent}"`
        },
      )

      const finalConfig = endent`
        ${beforeConfig || ""}
        module.exports = ${serializedConfig};
        ${afterConfig || ""}
      `

      const evaluatedFinalConfig = Function(
        "require",
        "module",
        `
        ${finalConfig};
        return module.exports;
      `,
      )(require, { exports: {} })

      return await processCSS(jsx, evaluatedFinalConfig, globalCss)
    }
  }

  const evaluatedBaseConfig = Function(
    "require",
    "module",
    `
    module.exports = ${baseTailwindConfig};
    return module.exports;
  `,
  )(require, { exports: {} })

  return await processCSS(jsx, evaluatedBaseConfig, globalCss)
}

const processCSS = async (jsx: string, config: object, globalCss: string) => {
  const result = await postcss([
    tailwindcss({
      ...config,
      content: [{ raw: jsx, extension: "tsx" }],
    }),
  ]).process(globalCss, {
    from: undefined,
  })
  return result.css
}

function convertVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -an "${outputPath}"`
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

const server = serve({
  port: 80,
  async fetch(req) {
    const origin = req.headers.get("origin")
    const allowedOrigins = ["http://localhost:3000", "https://21st.dev"]
    const headers = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin ?? "")
        ? (origin ?? "")
        : "",
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
          dep
            .split("\n")
            .filter((line: string) => !line.trim().startsWith("import"))
            .join("\n"),
        )

        const css = await compileCSS({
          jsx: `${filteredCode}\n${filteredDemoCode}\n${filteredDependencies.join("\n")}`,
          baseTailwindConfig,
          customTailwindConfig,
          baseGlobalCss,
          customGlobalCss,
        })

        return Response.json({ css }, { headers })
      } catch (error) {
        console.error("CSS compilation error:", error)
        return Response.json(
          { error: "Failed to compile CSS" },
          { status: 500, headers },
        )
      }
    }

    if (url.pathname === "/convert" && req.method === "POST") {
      try {
        console.log("Converting video")
        const formData = await req.formData()
        const file = formData.get("video") as File

        if (!file) {
          return Response.json(
            { error: "No video file provided" },
            { status: 400, headers },
          )
        }

        const tempDir = path.join(os.tmpdir(), "video-conversions")
        await fs.mkdir(tempDir, { recursive: true })

        const tempInputPath = path.join(tempDir, file.name)
        const tempOutputPath = path.join(
          tempDir,
          file.name.replace(/\.[^/.]+$/, "") + ".mp4",
        )

        const bytes = await file.arrayBuffer()
        await fs.writeFile(tempInputPath, Buffer.from(bytes))

        await convertVideo(tempInputPath, tempOutputPath)

        const processedVideo = await fs.readFile(tempOutputPath)

        await Promise.all([fs.unlink(tempInputPath), fs.unlink(tempOutputPath)])

        return new Response(processedVideo, {
          headers: {
            ...headers,
            "Content-Type": "video/mp4",
            "Content-Disposition": `attachment; filename="${path.basename(tempOutputPath)}"`,
          },
        })
      } catch (error) {
        console.error("Error processing video:", error)
        return Response.json(
          { error: "Error processing video" },
          { status: 500, headers },
        )
      }
    }

    return new Response("Not Found", { status: 404, headers })
  },
})

console.log(`Server running at http://localhost:${server.port}`)
