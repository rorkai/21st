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
      name !== undefined && !name.includes("(") && !name.match(/^[A-Z]/), // Исключаем имена, начинающиеся с заглавной буквы (вероятно, компоненты)
  )
}

export function extractDemoComponentName(code: string): string {
  if (!code) return ""
  const match = code.match(
    /export\s+(default\s+)?(async\s+)?function\s+([A-Z]\w+)/,
  )
  return match && match[3] ? match[3] : ""
}

export function extractDependencies(code: string): Record<string, string> {
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
          if (!defaultDependencies.includes(packageName)) {
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
            if (!defaultDependencies.includes(packageName)) {
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

export function findInternalDependencies(
  componentCode: string,
  demoCode: string,
): Record<string, string> {
  const internalDeps: Record<string, string> = {}

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
            source.startsWith("@/components/")
          ) {
            internalDeps[source] = "latest"
          }
        },
      })
    }

    parseAndExtractImports(componentCode)
    parseAndExtractImports(demoCode)
  } catch (error) {
    console.error("Error finding internal dependencies:", error)
  }

  return internalDeps
}

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
          importsToDrop.push({
            start: path.node.start!,
            end: path.node.end!,
            text: demoCode.slice(path.node.start!, path.node.end!),
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
  console.log("Original code:", code)
  console.log("Modified code:", modifiedCode)
  return modifiedCode
}

export function wrapExportInBraces(code: string): string {
  // Find the last export statement in the file
  const lastExportIndex = code.lastIndexOf("export")

  if (lastExportIndex !== -1) {
    // Get the content after the export keyword
    let afterExport = code.slice(lastExportIndex + 6).trim()
    // Remove any trailing semicolons
    afterExport = afterExport.replace(/;$/, "")
    // Check if it's already wrapped in braces
    if (!afterExport.startsWith("{")) {
      // Wrap the export in braces
      return code.slice(0, lastExportIndex) + "export { " + afterExport + " };"
    }
  }

  return code
}
