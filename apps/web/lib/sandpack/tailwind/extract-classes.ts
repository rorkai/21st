import * as ts from "typescript"

function extractClassesFromJSXAttribute(node: ts.JsxAttribute): string[] {
  if (!node.initializer) return []

  if (ts.isStringLiteral(node.initializer)) {
    return node.initializer.text.split(" ").filter(Boolean)
  }

  if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
    // Handle cn() calls
    if (
      ts.isCallExpression(node.initializer.expression) &&
      ts.isIdentifier(node.initializer.expression.expression) &&
      node.initializer.expression.expression.text === "cn"
    ) {
      return extractClassesFromCnCall(node.initializer.expression)
    }
  }

  return []
}

function extractClassesFromCnCall(node: ts.CallExpression): string[] {
  const classes: string[] = []

  node.arguments.forEach(arg => {
    if (ts.isStringLiteral(arg)) {
      classes.push(...arg.text.split(" ").filter(Boolean))
    } else if (ts.isTemplateExpression(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
      classes.push(...extractClassNamesFromTemplate(arg.getText()))
    }
  })

  return classes
}

function extractClassNamesFromTemplate(text: string): string[] {
  // Remove template literal backticks if present
  const cleanText = text.replace(/^[`"']|[`"']$/g, "")
  return cleanText.split(" ").filter(Boolean)
}

export function extractClassNamesFromFile(fileContent: string): string[] {
  const sourceFile = ts.createSourceFile(
    "temp.tsx",
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  )

  const classes = new Set<string>()

  function visit(node: ts.Node) {
    // Only process JSX attributes with className
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "className"
    ) {
      const extractedClasses = extractClassesFromJSXAttribute(node)
      extractedClasses.forEach((c) => classes.add(c))
    }

    // Only process string literals/template expressions that are part of className
    if (
      (ts.isStringLiteral(node) || ts.isTemplateExpression(node)) && 
      node.parent && 
      ts.isJsxExpression(node.parent) &&
      node.parent.parent &&
      ts.isJsxAttribute(node.parent.parent) &&
      ts.isIdentifier(node.parent.parent.name) &&
      node.parent.parent.name.text === "className"
    ) {
      const extractedClasses = extractClassNamesFromTemplate(node.getText())
      extractedClasses.forEach((c) => classes.add(c))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return Array.from(classes)
}

export function extractClassesWithVariants(fileContent: string) {
  const classNames = extractClassNamesFromFile(fileContent)

  const classesWithVariants = classNames.map((className) => {
    // Split but preserve arbitrary values in brackets
    const parts = className.split(/(?![^[]*]|[^(]*\)):/)

    // Remove the last part (actual class name)
    const baseClassName = parts.pop()

    return {
      pattern: baseClassName,
      variants: Array.from(parts),
    }
  })

  return classesWithVariants
}
