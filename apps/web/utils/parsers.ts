import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import * as t from "@babel/types"

export function extractComponentNames(code: string): string[] {
  const componentRegex =
    /export\s+(?:default\s+)?(?:function|const|class|let|var)\s+(\w+)|export\s*{\s*([^}]+)\s*}/g

  const matches = Array.from(code.matchAll(componentRegex))
  const componentNames = matches.flatMap((match) => {
    if (match[1]) {
      return [match[1]]
    } else if (match[2]) {
      return match[2].split(",").map((name) => name.trim().split(/\s+as\s+/)[0])
    }
    return []
  })

  const uniqueNames = [...new Set(componentNames)]

  console.log("Extracted exported names:", uniqueNames)

  return uniqueNames.filter((name): name is string => name !== undefined)
}

export function extractDemoComponentName(code: string): string {
  if (!code) return ""
  const match = code.match(/export\s+function\s+([A-Z]\w+)/)
  return match && match[1] ? match[1] : ""
}

export function extractDependencies(code: string): Record<string, string> {
  console.log("code in extractDependencies", code)
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
    console.log("dependencies in extractDependencies", dependencies)
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
    console.error("Ошибка при анализе зависимостей:", error)
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
        const importedNames = specifiers.map((s) =>
          t.isImportSpecifier(s) && t.isIdentifier(s.imported)
            ? s.imported.name
            : "",
        )

        if (importedNames.some((name) => componentNames.includes(name))) {
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
