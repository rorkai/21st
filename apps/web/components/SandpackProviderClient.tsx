import React, { useState, useEffect, useRef } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeViewer,
} from "@codesandbox/sandpack-react";

import { SandpackProvider as SandpackProviderUnstyled, SandpackPreview  } from "@codesandbox/sandpack-react/unstyled";
import { CopyIcon } from "lucide-react";
import styles from './SandpackProviderClient.module.css';

import { SandpackProviderProps } from "@codesandbox/sandpack-react";
import { motion, AnimatePresence } from "framer-motion";

interface SandpackProviderClientProps {
  files: Record<string, string>;
  dependencies: Record<string, string>;
  demoDependencies: Record<string, string>;
  demoComponentName: string;
  internalDependencies: Record<string, string>;
  showCode: boolean;
  installUrl: string;
  componentSlug: string;
}

export default function SandpackProviderClient({
  files,
  dependencies,
  demoDependencies,
  internalDependencies,
  showCode,
  installUrl,
  componentSlug,
}: SandpackProviderClientProps) {
  const [copied, setCopied] = useState(false);
  const sandpackRef = useRef<HTMLDivElement>(null);

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

  const updatedFiles: Record<string, string> = {
    ...files,
    ...internalDependencies,
    "/tsconfig.json": JSON.stringify(tsConfig, null, 2),
    "/lib/utils.ts": utilsContent,
    "/index.tsx": updatedIndexContent,
  };

  const mainComponentFile = Object.keys(updatedFiles).find(file => file.endsWith(`${componentSlug}.tsx`)) || 
                            Object.keys(updatedFiles)[0];

  const visibleFiles = [
    mainComponentFile,
    ...Object.keys(internalDependencies)
  ];

  const customFileLabels = Object.fromEntries(
    Object.keys(internalDependencies).map(file => [file, `${file.split('/').pop()} (dependencies)`])
  );

  const providerProps: SandpackProviderProps = {
    theme: "light",
    template: "react-ts" as const,
    files: updatedFiles,
    customSetup: {
      entry: "/index.tsx",
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        ...dependencies,
        ...demoDependencies,
      },
    },
    options: {
      externalResources: [
        "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/css/compiled-tailwind.css"
      ],
      activeFile: mainComponentFile,
      visibleFiles: visibleFiles,
    },
    fileLabels: customFileLabels,
  };

  const copyCommand = () => {
    const command = `npx shadcn@latest add "${installUrl}"`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    const updateTabLabels = () => {
      if (sandpackRef.current) {
        const tabs = sandpackRef.current.querySelectorAll('.sp-tab-button');
        tabs.forEach((tab: Element) => {
          if (tab instanceof HTMLElement) {
            const fileName = tab.getAttribute('title');
            if (fileName && Object.keys(internalDependencies).includes(fileName)) {
              if (!tab.querySelector('.dependencies-label')) {
                const span = document.createElement('span');
                span.className = 'dependencies-label text-[#808080] ml-1';
                span.textContent = '(dependencies)';
                tab.appendChild(span);
              }
            }
          }
        });
      }
    }; // Добавлена закрывающая скобка здесь

    // Вызываем функцию сразу и затем каждые 100мс в течение 1 секунды
    updateTabLabels();
    const interval = setInterval(updateTabLabels, 100);
    setTimeout(() => clearInterval(interval), 1000);

    return () => clearInterval(interval);
  }, [internalDependencies, showCode]);

  return (
    <div className="h-full w-full flex gap-4 bg-[#FAFAFA] rounded-lg">
      <SandpackProviderUnstyled {...providerProps}>
        <motion.div
          layout
          className="flex-grow h-full"
          transition={{ duration: 0.3 }}
        >
          <SandpackPreview />
        </motion.div>
      </SandpackProviderUnstyled>
      <AnimatePresence>
        {showCode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full max-w-[40%] overflow-hidden rounded-lg border border-[#efefef]"
          >
            <SandpackProvider {...providerProps}>
              <div ref={sandpackRef} className="h-full w-full flex">
                <SandpackLayout className="flex w-full flex-row gap-4">
                  <div className={`flex flex-col w-full ${styles.customScroller}`}>
                    <div className="flex w-full flex-col">
                      <>
                      <div className="p-4">
                        <p className="text-[17px] font-medium mb-4 whitespace-nowrap overflow-hidden text-ellipsis">Add component to project</p>
                        <div className="mb-2 mt-4 p-4 max-h-[650px] rounded-lg border bg-zinc-950 py-4 dark:bg-zinc-900 flex items-center">
                          <div className="flex-grow overflow-hidden">
                            <code data-language="bash" data-theme="default" className="whitespace-nowrap font-mono text-sm block overflow-x-auto">
                              <span className="text-white">npx</span> <span className="text-gray-400">shadcn@latest add "{installUrl}"</span>
                            </code>
                          </div>
                          <button 
                            onClick={copyCommand}
                            className="flex-shrink-0 ml-2 flex items-center rounded-md justify-center p-1 hover:bg-zinc-800 text-white w-6 h-6"
                          >
                            <CopyIcon />
                          </button>
                        </div>
                      </div>
                      <div className={`overflow-auto ${styles.codeViewerWrapper}`}>
                        <SandpackCodeViewer
                          showLineNumbers={true}
                          wrapContent={true}
                        />
                      </div>
                      </>
                    </div>
                  </div>
                </SandpackLayout>
              </div>
            </SandpackProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}