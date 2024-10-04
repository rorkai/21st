import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export function extractComponentNames(code: string): string[] {
  if (!code) return [];
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const exportedComponents: string[] = [];

  traverse(ast, {
    ExportNamedDeclaration(path) {
      const declaration = path.node.declaration;
      if (declaration) {
        if (t.isFunctionDeclaration(declaration) && declaration.id) {
          exportedComponents.push(declaration.id.name);
        } else if (t.isVariableDeclaration(declaration)) {
          declaration.declarations.forEach((d) => {
            if (t.isIdentifier(d.id)) {
              exportedComponents.push(d.id.name);
            }
          });
        } else if (t.isClassDeclaration(declaration) && declaration.id) {
          exportedComponents.push(declaration.id.name);
        }
      } else if (path.node.specifiers) {
        path.node.specifiers.forEach((specifier) => {
          if (t.isExportSpecifier(specifier)) {
            if (t.isIdentifier(specifier.exported)) {
              exportedComponents.push(specifier.exported.name);
            }
          }
        });
      }
    },
    ExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      if (t.isIdentifier(declaration)) {
        exportedComponents.push(declaration.name);
      } else if (t.isFunctionDeclaration(declaration) && declaration.id) {
        exportedComponents.push(declaration.id.name);
      } else if (t.isClassDeclaration(declaration) && declaration.id) {
        exportedComponents.push(declaration.id.name);
      }
    },
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        t.isVariableDeclaration(path.parent) &&
        path.parentPath &&
        t.isExportNamedDeclaration(path.parentPath.parent)
      ) {
        exportedComponents.push(path.node.id.name);
      }
    },
  });

  return exportedComponents;
}

export function extractDemoComponentName(code: string): string {
  if (!code) return "";
  const match = code.match(/export\s+function\s+([A-Z]\w+)/);
  return match && match[1] ? match[1] : "";
}

export function parseDependencies(code: string): Record<string, string> {
  const dependencies: Record<string, string> = {};
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
    });

    const defaultDependencies = ["react", "react-dom", "tailwindcss"];

    traverse(ast, {
      ImportDeclaration({ node }) {
        const importDeclaration = node as t.ImportDeclaration;
        const source = importDeclaration.source.value;
        if (
          typeof source === "string" &&
          !source.startsWith(".") &&
          !source.startsWith("/") &&
          !source.startsWith("@/")
        ) {
          let packageName = source;
          if (!defaultDependencies.includes(packageName)) {
            dependencies[packageName] = "latest";
          }
        }
      },
      ImportNamespaceSpecifier(path) {
        const importDeclaration = path.findParent((p) =>
          p.isImportDeclaration()
        );
        if (
          importDeclaration &&
          t.isImportDeclaration(importDeclaration.node)
        ) {
          const source = importDeclaration.node.source.value;
          if (
            typeof source === "string" &&
            !source.startsWith(".") &&
            !source.startsWith("/") &&
            !source.startsWith("@/")
          ) {
            let packageName = source;
            if (!defaultDependencies.includes(packageName)) {
              dependencies[packageName] = "latest";
            }
          }
        }
      },
    });
  } catch (error) {
    console.error("Error parsing dependencies:", error);
  }

  return dependencies;
}

export function parseInternalDependencies(code: string): Record<string, string> {
  const internalDeps: Record<string, string> = {};
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
    });

    traverse(ast, {
      ImportDeclaration({ node }) {
        const source = node.source.value;
        if (
          typeof source === "string" &&
          source.startsWith("@/components/")
        ) {
          if (!internalDeps[source]) {
            internalDeps[source] = "";
          }
        }
      },
    });
  } catch (error) {
    console.error("Error parsing internal dependencies:", error);
  }

  return internalDeps;
}

export function removeComponentImports(
  demoCode: string,
  componentNames: string[]
): { modifiedCode: string; removedImports: string[] } {
  const ast = parse(demoCode, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const importsToDrop: { start: number; end: number; text: string }[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const specifiers = path.node.specifiers;
      const importedNames = specifiers.map((s) =>
        t.isImportSpecifier(s) && t.isIdentifier(s.imported)
          ? s.imported.name
          : ""
      );

      if (importedNames.some((name) => componentNames.includes(name))) {
        importsToDrop.push({
          start: path.node.start!,
          end: path.node.end!,
          text: demoCode.slice(path.node.start!, path.node.end!),
        });
      }
    },
  });

  let modifiedCode = demoCode;
  const removedImports: string[] = [];
  for (let i = importsToDrop.length - 1; i >= 0; i--) {
    const importToDrop = importsToDrop[i];
    if (importToDrop) {
      const { start, end, text } = importToDrop;
      modifiedCode = modifiedCode.slice(0, start) + modifiedCode.slice(end);
      removedImports.push(text);
    }
  }

  return { modifiedCode: modifiedCode.trim(), removedImports };
}