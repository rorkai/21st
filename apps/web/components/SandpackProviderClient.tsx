import React from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

interface SandpackProviderClientProps {
  files: Record<string, string>;
  dependencies: Record<string, string>;
  demoComponentName: string;
}

export default function SandpackProviderClient({
  files,
  dependencies,
}: SandpackProviderClientProps) {
  const tsConfig = {
    compilerOptions: {
      jsx: "react-jsx",
      esModuleInterop: true,
      baseUrl: ".",
      paths: {
        "@/*": ["./*"],
      },
    },
  };

  const utilsContent = `
export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
  `;

  const updatedFiles: Record<string, string> = {
    ...files,
    "/tsconfig.json": JSON.stringify(tsConfig, null, 2),
    "/lib/utils.ts": utilsContent,
  };

  const updatedIndexContent = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
  `;

  updatedFiles["/index.tsx"] = updatedIndexContent;

  return (
    <SandpackProvider
      theme="dark"
      template="react-ts"
      files={updatedFiles}
      customSetup={{
        entry: "/index.tsx",
        dependencies: {
          react: "^18.0.0",
          "react-dom": "^18.0.0",
          ...dependencies,
        },
      }}
      options={{
        externalResources: [
          "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/css/compiled-tailwind.css"
        ],
        classes: {
          "sp-wrapper": "custom-wrapper",
          "sp-layout": "custom-layout",
          "sp-tab-button": "custom-tab",
        },
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer />
        <SandpackCodeEditor
          showLineNumbers={true}
          showInlineErrors={true}
          wrapContent={true}
        />
        <SandpackPreview />
      </SandpackLayout>
    </SandpackProvider>
  );
}