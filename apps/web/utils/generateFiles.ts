export function generateFiles({
  demoComponentName,
  componentSlug,
  code,
  demoCode,
}: {
  demoComponentName: string
  componentSlug: string
  code: string
  demoCode: string
}) {
  const files = {
    "/App.tsx": `
import React from 'react';
import { ${demoComponentName} } from './Demo';

export default function App() {
  return (
    <div className="flex justify-center items-center h-screen p-4 relative">
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        opacity: 0.5,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(#00000055 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }}>
        <style>{\`
          @media (prefers-color-scheme: dark) {
            div {
              background: radial-gradient(#ffffff22 1px, transparent 1px);
            }
          }
        \`}</style>
      </div>
      <div className="flex justify-center items-center max-w-[600px] w-full h-full max-h-[600px] p-4 relative">
        <${demoComponentName} />
      </div>
    </div>
  );
}
`,
    [`/${componentSlug}.tsx`]: code,
    "/Demo.tsx": demoCode,
    "/lib/utils.ts": `
export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
`,
    "/tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          esModuleInterop: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
      },
      null,
      2,
    ),
  }

  return files
}
