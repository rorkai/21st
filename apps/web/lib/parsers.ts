import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import * as t from "@babel/types"

export function extractComponentNames(code: string): string[] {
  const componentRegex =
    /export\s+(?:default\s+)?(?:function|const|class|let|var)\s+(\w+)|export\s*{\s*([^}]+)\s*}|export\s+(\w+)\s*;/g

  const matches = Array.from(code.matchAll(componentRegex))
  const componentNames = matches.flatMap((match) => {
    if (match[1]) {
      return [match[1]]
    } else if (match[2]) {
      return match[2].split(",").map((name) => name.trim().split(/\s+as\s+/)[0])
    } else if (match[3]) {
      return [match[3]]
    }
    return []
  })

  const uniqueNames = [...new Set(componentNames)]

  return uniqueNames.filter((name): name is string => name !== undefined)
}

export function extractExportedTypes(code: string): string[] {
  const typeRegex = /export\s+(type|interface)\s+(\w+)(?![=(])/g
  const exportedTypeRegex = /export\s*{\s*(?:type|interface)?\s*([^}]+)\s*}/g

  const matches = Array.from(code.matchAll(typeRegex))
  const exportedMatches = Array.from(code.matchAll(exportedTypeRegex))

  const typeNames = matches.map((match) => match[2])
  const exportedNames = exportedMatches.flatMap((match) =>
    match[1]?.split(",").map((name) => {
      const trimmed = name.trim()
      return trimmed.startsWith("type ") || trimmed.startsWith("interface ")
        ? trimmed.split(/\s+/)[1]
        : trimmed.split(/\s+as\s+/)[0]
    }),
  )

  const uniqueNames = [...new Set([...typeNames, ...exportedNames])]

  return uniqueNames.filter(
    (name): name is string =>
      name !== undefined && !name.includes("(") && !name.match(/^[A-Z]/),
  )
}

export function extractDemoComponentNames(code: string): string[] {
  if (!code) return []

  const componentNames: string[] = []

  // Match the original format: export default { ... }
  const defaultExportMatch = code.match(/export\s+default\s+{\s*([^}]+)\s*}/s)
  if (defaultExportMatch && defaultExportMatch[1]) {
    componentNames.push(
      ...defaultExportMatch[1]
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
    )
  }

  // Match named exports: export function ComponentName() { ... }
  const namedExportMatches = code.matchAll(/export\s+function\s+(\w+)/g)
  for (const match of namedExportMatches) {
    if (match[1]) {
      componentNames.push(match[1])
    }
  }

  // Match named exports: export { ComponentName }
  const namedExportBraceMatches = code.matchAll(/export\s*{\s*([^}]+)\s*}/g)
  for (const match of namedExportBraceMatches) {
    if (match[1]) {
      componentNames.push(
        ...match[1]
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
      )
    }
  }

  return [...new Set(componentNames)] // Remove duplicates
}

export function extractNPMDependencies(code: string): Record<string, string> {
  const dependencies: Record<string, string> = {}
  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: [
        "typescript",
        "jsx",
        "decorators-legacy",
        "classProperties",
        "objectRestSpread",
        "dynamicImport",
      ],
    })

    const defaultDependencies = ["react", "react-dom", "tailwindcss"]

    const shouldAddDependency = (packageName: string) => {
      return (
        !defaultDependencies.includes(packageName) &&
        !packageName.startsWith("next")
      )
    }

    traverse(ast, {
      ImportDeclaration({ node }) {
        const importDeclaration = node as t.ImportDeclaration
        const source = importDeclaration.source.value
        if (
          typeof source === "string" &&
          !source.startsWith(".") &&
          !source.startsWith("/") &&
          !source.startsWith("@/")
        ) {
          let packageName = source
          if (packageName === "motion/react") {
            packageName = "motion"
          }
          if (shouldAddDependency(packageName)) {
            dependencies[packageName] = "latest"
          }
        }
      },
      ImportNamespaceSpecifier(path) {
        const importDeclaration = path.findParent((p) =>
          p.isImportDeclaration(),
        )
        if (
          importDeclaration &&
          t.isImportDeclaration(importDeclaration.node)
        ) {
          const source = importDeclaration.node.source.value
          if (
            typeof source === "string" &&
            !source.startsWith(".") &&
            !source.startsWith("/") &&
            !source.startsWith("@/")
          ) {
            let packageName = source
            if (packageName === "motion/react") {
              packageName = "motion"
            }
            if (shouldAddDependency(packageName)) {
              dependencies[packageName] = "latest"
            }
          }
        }
      },
    })
  } catch (error) {
    console.error("Error parsing dependencies:", error)
  }

  return dependencies
}

export function extractAmbigiousRegistryDependencies(code: string) {
  const registryDeps: Record<
    string,
    { importPath: string; slug: string; registry: string }
  > = {}

  try {
    const parseAndExtractImports = (code: string) => {
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      })

      traverse(ast, {
        ImportDeclaration({ node }) {
          const source = node.source.value
          if (
            typeof source === "string" &&
            source.match(/^@\/components\/[^/]+\//)
          ) {
            const registry = source.match(/^@\/components\/([^/]+)\//)?.[1]
            registryDeps[source] = {
              importPath: source,
              slug: source.replace(/^@\/components\/[^/]+\//, ""),
              registry: registry ?? "",
            }
          }
        },
      })
    }

    parseAndExtractImports(code)
  } catch (error) {
    console.error("Error finding registry dependencies:", error)
  }

  return registryDeps
}

export function extractRegistryDependenciesFromImports(code: string): string[] {
  const registryDeps = []

  const importRegex =
    /import\s+(?:{\s*[\w\s,]+\s*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](\+@[\w-]+\/[\w-]+)['"]/g
  let match

  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1]!
    const [, author, slug] = importPath.match(/\+@([\w-]+)\/([\w-]+)/)!
    registryDeps.push(`${author}/${slug}`)
  }

  return registryDeps
}

// export function replaceRegistryImports(code: string): string {
//   const importRegex =
//     /import\s+(?:{\s*[\w\s,]+\s*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](\+@[\w-]+\/[\w-]+)['"]/g

//   return code.replace(importRegex, (match, importPath) => {
//     const [, , slug] = importPath.match(/\+@([\w-]+)\/([\w-]+)/)!
//     const newImportPath = `@/components/ui/${slug}`
//     return match.replace(importPath, newImportPath)
//   })
// }

export function removeComponentImports(
  demoCode: string,
  componentNames: string[],
): { modifiedCode: string; removedImports: string[] } {
  try {
    const ast = parse(demoCode, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      errorRecovery: true,
    })

    const importsToDrop: { start: number; end: number; text: string }[] = []

    traverse(ast, {
      ImportDeclaration(path) {
        const specifiers = path.node.specifiers
        const importedNames = specifiers.map((s) => {
          if (t.isImportDefaultSpecifier(s) || t.isImportSpecifier(s)) {
            return s.local.name
          }
          return ""
        })

        const shouldDropImport = importedNames.some(
          (name) =>
            componentNames.includes(name) ||
            componentNames.some((componentName) =>
              name.startsWith(componentName),
            ),
        )

        if (shouldDropImport) {
          let start = path.node.start!
          let end = path.node.end!

          const nextChar = demoCode[end]
          if (nextChar === "\n") {
            end += 1
          } else if (demoCode.slice(end, end + 2) === "\r\n") {
            end += 2
          }

          importsToDrop.push({
            start,
            end,
            text: demoCode.slice(start, end),
          })
        }
      },
    })

    let modifiedCode = demoCode
    const removedImports: string[] = []
    for (let i = importsToDrop.length - 1; i >= 0; i--) {
      const importToDrop = importsToDrop[i]
      if (importToDrop) {
        const { start, end, text } = importToDrop
        modifiedCode = modifiedCode.slice(0, start) + modifiedCode.slice(end)
        removedImports.push(text)
      }
    }

    return { modifiedCode: modifiedCode.trim(), removedImports }
  } catch (error) {
    console.error("Error parsing demo code:", error)
    return { modifiedCode: demoCode, removedImports: [] }
  }
}

export function removeAsyncFromExport(code: string): string {
  const asyncExportRegex = /export\s+async\s+function/g
  const modifiedCode = code.replace(asyncExportRegex, "export function")
  return modifiedCode
}

export function wrapExportInBraces(code: string): string {
  return code.replace(
    /export\s+(?!\{)(?!function|class|interface|type)([^;]+);?/g,
    "export { $1 };",
  )
}

export function extractCssVars(css: string): {
  light: Record<string, string>
  dark: Record<string, string>
} {
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}

  // Extract root CSS vars
  const rootMatch = css.match(/:root\s*{([^}]*)}/)?.[1]
  if (rootMatch) {
    const varMatches = rootMatch.matchAll(/--([^:]+):\s*([^;]+);/g)
    for (const match of varMatches) {
      const [, name, value] = match
      light[`--${name?.trim()}`] = value?.trim() ?? ""
    }
  }

  // Extract dark mode CSS vars
  const darkMatch = css.match(/\.dark\s*{([^}]*)}/)?.[1]
  if (darkMatch) {
    const varMatches = darkMatch.matchAll(/--([^:]+):\s*([^;]+);/g)
    for (const match of varMatches) {
      const [, name, value] = match
      dark[`--${name?.trim()}`] = value?.trim() ?? ""
    }
  }

  return { light, dark }
}
