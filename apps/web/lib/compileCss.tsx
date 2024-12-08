"use server"

import tailwindcss from "tailwindcss"
import postcss from "postcss"

export const compileCSS = async (
  jsx: string,
  tailwindConfig?: string,
  globalCss?: string,
) => {
  const configObject = tailwindConfig 
    ? new Function('module', `
        const exports = {};
        ${tailwindConfig};
        return module.exports;
      `)({ exports: {} })
    : {};

  const result = await postcss([
    tailwindcss({
      ...configObject,
      content: [
        { raw: jsx, extension: "tsx" },
      ],
    }),
  ]).process(globalCss ?? "@tailwind base;@tailwind components;@tailwind utilities;", {
    from: undefined,
  })
  return result.css
}
