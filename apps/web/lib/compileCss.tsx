"use server"

import tailwindcss from "tailwindcss"
import postcss from "postcss"

export const compileCSS = async (jsx: string) => {
  const result = await postcss([
    tailwindcss({
      content: [{ raw: jsx, extension: "jsx" }],
    }),
  ]).process("@tailwind base;@tailwind components;@tailwind utilities;", {
    from: undefined,
  })
  return result.css
}