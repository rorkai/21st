/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/utils/supabase";
import { Button } from "./ui/button";
import { LayoutTemplate, CodeXml, Link, Tag } from "lucide-react";
import { LoadingSpinner } from "./Loading";
import { useAtom } from "jotai";
import { atom } from "jotai";
import { isClientAtom, isLoadingAtom, showLoadingAtom } from "@/lib/atoms";
import { Component } from '@/types/types';
import { UserAvatar } from './UserAvatar';

const codeAtom = atom("");
const demoCodeAtom = atom("");
const dependenciesAtom = atom<Record<string, string>>({});
const demoDependenciesAtom = atom<Record<string, string>>({});
const internalDependenciesCodeAtom = atom<Record<string, string>>({});
const showCodeAtom = atom(false);
const isSharingAtom = atom(false);
const shareButtonTextAtom = atom("Share");

const SandpackProviderClient = dynamic(
  () => import("./SandpackProviderClient"),
  { ssr: false, loading: () => null }
);

export default function ComponentPreview({
  component,
}: {
  component: Component;
}) {
  const [isClient, setIsClient] = useAtom(isClientAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [showLoading, setShowLoading] = useAtom(showLoadingAtom);
  const [code, setCode] = useAtom(codeAtom);
  const [demoCode, setDemoCode] = useAtom(demoCodeAtom);
  const [dependencies, setDependencies] = useAtom(dependenciesAtom);
  const [demoDependencies, setDemoDependencies] = useAtom(demoDependenciesAtom);
  const [internalDependenciesCode, setInternalDependenciesCode] = useAtom(
    internalDependenciesCodeAtom
  );
  const [showCode, setShowCode] = useAtom(showCodeAtom);
  const [isSharing, setIsSharing] = useAtom(isSharingAtom);
  const [shareButtonText, setShareButtonText] = useAtom(shareButtonTextAtom);

  useEffect(() => {
    setIsClient(true);
    async function fetchCode() {
      const loadingTimeout = setTimeout(() => setShowLoading(true), 300);
      setIsLoading(true);
      try {
        const { data: codeData, error: codeError } = await supabase.storage
          .from("components")
          .download(`${component.component_slug}-code.tsx`);

        const { data: demoData, error: demoError } = await supabase.storage
          .from("components")
          .download(`${component.component_slug}-demo.tsx`);

        if (codeError || demoError) {
          console.error("Error fetching code:", codeError || demoError);
          return;
        }

        const codeText = await codeData.text();
        const rawDemoCode = await demoData.text();

        setCode(codeText);
        const componentNames = parseComponentNames(component.component_name);
        const updatedDemoCode = `import { ${componentNames.join(", ")} } from "./${component.component_slug}";\n${rawDemoCode}`;
        setDemoCode(updatedDemoCode);

        const componentDependencies = JSON.parse(
          component.dependencies || "{}"
        );
        const componentDemoDependencies = JSON.parse(
          component.demo_dependencies || "{}"
        );
        const componentInternalDependencies = JSON.parse(
          component.internal_dependencies || "{}"
        );
        setDependencies(componentDependencies);
        setDemoDependencies(componentDemoDependencies);

        await fetchInternalDependencies(componentInternalDependencies);
      } catch (error) {
        console.error("Error in fetchCode:", error);
      } finally {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        setShowLoading(false);
      }
    }

    fetchCode();
  }, [component]);

  async function fetchInternalDependencies(
    componentInternalDependencies: Record<string, string | string[]>
  ) {
    const internalDepsCode: Record<string, string> = {};
    for (const [path, slugs] of Object.entries(componentInternalDependencies)) {
      if (typeof slugs === "string") {
        await fetchSingleDependency(path, slugs, internalDepsCode);
      } else if (Array.isArray(slugs)) {
        for (const slug of slugs) {
          await fetchSingleDependency(path, slug, internalDepsCode);
        }
      }
    }
    setInternalDependenciesCode(internalDepsCode);
  }

  async function fetchSingleDependency(
    path: string,
    slug: string,
    internalDepsCode: Record<string, string>
  ) {
    try {
      const { data, error } = await supabase.storage
        .from("components")
        .download(`${slug}-code.tsx`);

      if (error) {
        console.error(`Error loading internal dependency ${slug}:`, error);
        return;
      }

      const dependencyCode = await data.text();
      const fullPath = path.endsWith('.tsx') ? path : `${path}.tsx`;
      internalDepsCode[fullPath] = dependencyCode;
    } catch (error) {
      console.error(`Error fetching dependency ${slug}:`, error);
    }
  }

  const demoComponentName = component.demo_component_name;

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
        <style>{
          \`@media (prefers-color-scheme: dark) {
            div {
              background: radial-gradient(#ffffff22 1px, transparent 1px);
            }
          }\`
        }</style>
      </div>
      <div className="flex justify-center items-center max-w-[600px] w-full h-full max-h-[600px] p-4 relative">
      <${demoComponentName} />
      </div>
    </div>
  );
}
`,
    [`/${component.component_slug}.tsx`]: code,
    "/Demo.tsx": demoCode,
  };

  const handleShareClick = async () => {
    setIsSharing(true);
    const url = `${window.location.origin}/${component.user.username}/${component.component_slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareButtonText("Copied");
      setTimeout(() => setShareButtonText("Share"), 2000);
    } catch (err) {
      console.error("Error copying link: ", err);
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-4 rounded-lg p-4 bg-slate-50 h-[90vh] w-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
            <a href={`/${component.user.username}`}>
              <UserAvatar src={component.user.image_url || '/placeholder.svg'} alt={component.user.name} size={32} />
            </a>
            <div className="h-10 w-[1px] bg-gray-200" />
          <div className="flex gap-2 items-start">
            <p className="text-[17px] font-semibold">{component.name}</p>
            <p className="text-[17px] text-gray-600">{component.description}</p>
            {component.tags && component.tags.length > 0 && (
              <div className="flex gap-2 ml-2">
                {component.tags.map((tag) => (
                  <div key={tag.slug} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                    <Tag size={12} />
                    {tag.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleShareClick}
            disabled={isSharing}
          >
            {shareButtonText}
            <div className="ml-2 w-5 h-5 flex items-center justify-center">
              <Link size={20} />
            </div>
          </Button>
          <Button onClick={() => setShowCode(!showCode)}>
            {showCode ? "Canvas" : "Code"}
            <div className="ml-2 w-5 h-5 flex items-center justify-center">
              {showCode ? <LayoutTemplate /> : <CodeXml />}
            </div>
          </Button>
        </div>
      </div>
      {isLoading && showLoading && <LoadingSpinner />}
      {isClient && !isLoading && (
        <div className="flex w-full !flex-grow">
          <SandpackProviderClient
            files={files}
            dependencies={dependencies}
            demoDependencies={demoDependencies}
            demoComponentName={demoComponentName}
            internalDependencies={internalDependenciesCode}
            showCode={showCode}
            installUrl={component.install_url}
            componentSlug={component.component_slug}
          />
        </div>
      )}
    </div>
  );
}

function parseComponentNames(componentName: string): string[] {
  try {
    return JSON.parse(componentName);
  } catch {
    return [componentName];
  }
}
