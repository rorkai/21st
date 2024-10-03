import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeViewer,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";

import { SandpackProvider as SandpackProviderUnstyled } from "@codesandbox/sandpack-react/unstyled";
import { CheckIcon, CopyIcon, Terminal, Clipboard, Loader2 } from "lucide-react";
import styles from './SandpackProviderClient.module.css';

import { SandpackProviderProps } from "@codesandbox/sandpack-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from 'jotai';
import {
  copiedAtom,
  codeCopiedAtom,
  isHoveringAtom,
  isDebugAtom,
  activeFileAtom,
  isComponentsLoadedAtom
} from '@/lib/atoms';

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

const LazyPreview = React.lazy(() => import("@codesandbox/sandpack-react/unstyled").then(module => ({ default: module.SandpackPreview })));

const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

export default function SandpackProviderClient({
  files,
  dependencies,
  demoDependencies,
  internalDependencies,
  showCode,
  installUrl,
  componentSlug,
}: SandpackProviderClientProps) {
  const [copied, setCopied] = useAtom(copiedAtom);
  const [codeCopied, setCodeCopied] = useAtom(codeCopiedAtom);
  const [isHovering, setIsHovering] = useAtom(isHoveringAtom);
  const sandpackRef = useRef<HTMLDivElement>(null);
  const [isDebug, setIsDebug] = useAtom(isDebugAtom);
  const [activeFile, setActiveFile] = useAtom(activeFileAtom);
  const [isComponentsLoaded, setIsComponentsLoaded] = useAtom(isComponentsLoadedAtom);

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

  // Add files for internal dependencies
  Object.entries(internalDependencies).forEach(([path, code]) => {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    updatedFiles[`/components/${fileName}`] = code;
  });

  const mainComponentFile = Object.keys(updatedFiles).find(file => file.endsWith(`${componentSlug}.tsx`)) || 
                            Object.keys(updatedFiles)[0];

  const visibleFiles = [
    mainComponentFile,
    ...Object.keys(internalDependencies).map(path => {
      const parts = path.split('/');
      return `/components/${parts[parts.length - 1]}`;
    })
  ];

  const customFileLabels = Object.fromEntries(
    Object.keys(internalDependencies).map(path => {
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      return [`/components/${fileName}`, `${fileName} (dependencies)`];
    })
  );

  // Function to extract dependencies from internal component code
  const extractInternalDependencies = (code: string): Record<string, string> => {
    const deps: Record<string, string> = {};
    const lines = code.split('\n');
    lines.forEach(line => {
      if (line.startsWith('import') && !line.includes('./') && !line.includes('../') && !line.includes('@/')) {
        const match = line.match(/from\s+['"](.+)['"]/);
        if (match && match[1]) {
          deps[match[1]] = 'latest';
        }
      }
    });
    return deps;
  };

  // Collect all dependencies from internal components
  const allInternalDependencies = Object.values(internalDependencies).reduce((acc, code) => {
    return { ...acc, ...extractInternalDependencies(code) };
  }, {});

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
        ...allInternalDependencies, // Add internal component dependencies
      },
    },
    options: {
      externalResources: [
        "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/css/compiled-tailwind.css"
      ],
      activeFile: activeFile,
      visibleFiles: visibleFiles.filter((file): file is string => file !== undefined),
    },
    ...({fileLabels: customFileLabels} as any),
  };

  const copyCommand = () => {
    const command = `npx shadcn@latest add "${installUrl}"`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    const codeElement = sandpackRef.current?.querySelector('.sp-code-editor');
    if (codeElement) {
      const code = codeElement.textContent;
      navigator.clipboard.writeText(code || '');
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
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
            
            tab.addEventListener('click', () => {
              if (fileName) {
                setActiveFile(fileName);
              }
            });
          }
        });
      }
    };

    updateTabLabels();
    const interval = setInterval(updateTabLabels, 100);
    setTimeout(() => clearInterval(interval), 1000);

    return () => clearInterval(interval);
  }, [internalDependencies, showCode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        setIsDebug(prevState => !prevState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const checkComponentsLoaded = async () => {
      try {
        const loadingTimeout = setTimeout(() => setShowLoading(true), 1000);
        await import("@codesandbox/sandpack-react/unstyled");
        clearTimeout(loadingTimeout);
        setIsComponentsLoaded(true);
      } catch (error) {
        console.error("Error loading components:", error);
      } finally {
        setShowLoading(false);
      }
    };

    checkComponentsLoaded();
  }, []);

  if (!isComponentsLoaded && showLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full w-full flex gap-4 bg-[#FAFAFA] rounded-lg">
      <SandpackProviderUnstyled {...providerProps}>
        <motion.div
          layout
          className="flex-grow h-full relative"
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <LazyPreview />
          </Suspense>
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
              <div ref={sandpackRef} className="h-full w-full flex relative">
                <SandpackLayout className="flex w-full flex-row gap-4">
                  <div className={`flex flex-col w-full ${styles.customScroller}`}>
                    <div className="flex w-full flex-col">
                      <>
                      <div className="p-4">
                        <p className="text-[17px] font-medium mb-4 whitespace-nowrap overflow-hidden text-ellipsis">Add component to project</p>
                        <div className="mb-2 mt-4 p-4 h-14 rounded-lg border bg-zinc-950 dark:bg-zinc-900 flex items-center">
                          <div className="flex items-center justify-center text-white w-5 h-5 mr-3">
                            <Terminal size={20} />
                          </div>
                          <div className="flex-grow overflow-hidden">
                            <code className="flex items-center whitespace-nowrap font-mono text-sm">
                              <span className="mr-2 text-white">npx</span>
                              <span className="text-gray-400">shadcn@latest add "{installUrl}"</span>
                            </code>
                          </div>
                          <button 
                            onClick={copyCommand}
                            className="flex-shrink-0 ml-3 flex items-center justify-center p-1 hover:bg-zinc-800 text-white w-8 h-8 rounded-md"
                          >
                            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                          </button>
                        </div>
                      </div>
                      {isDebug && (
                        <SandpackFileExplorer />
                      )}
                      <div 
                        className={`overflow-auto ${styles.codeViewerWrapper} relative`}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        <AnimatePresence>
                          {isHovering && (
                            <motion.button 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={copyCode}
                              className={`absolute flex items-center gap-2 ${visibleFiles.length > 1 ? 'top-12' : 'top-2'} right-2 z-10 p-1 px-2 bg-white border text-gray-500 border-[#efefef] rounded-md hover:bg-gray-100 transition-colors ${codeCopied ? 'opacity-0' : 'opacity-100'}`}
                            >
                              Copy Code {codeCopied ? <CheckIcon size={16} /> : <Clipboard size={16} />}
                            </motion.button>
                          )}
                        </AnimatePresence>
                        
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
      {isDebug && (
        <div className="absolute top-0 left-0 bg-black text-white p-2 z-50">
          Debug Mode
        </div>
      )}
    </div>
  );
}