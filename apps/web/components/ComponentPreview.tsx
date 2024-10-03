"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/utils/supabase';
import { Button } from './ui/button';
import { LayoutTemplate, CodeXml, Link } from 'lucide-react';
import { useToast } from "@/components/hooks/use-toast";

const SandpackProviderClient = dynamic(
  () => import('./SandpackProviderClient'),
  { ssr: false }
);

interface Component {
  id: string;
  description: string;
  code: string;
  demo_code: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  install_url: string;
  dependencies: string;
  is_public: boolean;
  downloads_count: number;
  likes_count: number;
  component_slug: string;
  name: string;
  component_name: string;
  demo_component_name: string;
  demo_dependencies: string;
  internal_dependencies: string;
}

export default function ComponentPreview({ component }: { component: Component }) {
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [dependencies, setDependencies] = useState<Record<string, string>>({});
  const [demoDependencies, setDemoDependencies] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);
  const [internalDependencies, setInternalDependencies] = useState<Record<string, string>>({});
  const [internalDependenciesCode, setInternalDependenciesCode] = useState<Record<string, string>>({});
  const [showCode, setShowCode] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareButtonText, setShareButtonText] = useState("Share");
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    async function fetchCode() {
      const { data: codeData, error: codeError } = await supabase.storage
        .from('components')
        .download(`${component.component_slug}-code.tsx`);

      const { data: demoData, error: demoError } = await supabase.storage
        .from('components')
        .download(`${component.component_slug}-demo.tsx`);

      if (codeError || demoError) {
        console.error('Error fetching code:', codeError || demoError);
        return;
      }

      setCode(await codeData.text());
      const rawDemoCode = await demoData.text();
      const componentNames = parseComponentNames(component.component_name);
      const updatedDemoCode = `import { ${componentNames.join(', ')} } from "./${component.component_slug}";\n${rawDemoCode}`;
      setDemoCode(updatedDemoCode);

      const componentDependencies = JSON.parse(component.dependencies || '{}');
      const componentDemoDependencies = JSON.parse(component.demo_dependencies || '{}');
      const componentInternalDependencies = JSON.parse(component.internal_dependencies || '{}');
      setDependencies(componentDependencies);
      setDemoDependencies(componentDemoDependencies);
      setInternalDependencies(componentInternalDependencies);
    }

    fetchCode();
  }, [component.component_slug, component.component_name, component.dependencies, component.demo_dependencies, component.internal_dependencies]);

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
      <${demoComponentName} />
    </div>
  );
}
`,
    [`/${component.component_slug}.tsx`]: code,
    "/Demo.tsx": demoCode,
  };

  useEffect(() => {
    const componentInternalDependencies = JSON.parse(component.internal_dependencies || '{}');
    setInternalDependencies(componentInternalDependencies);

    async function fetchInternalDependencies() {
      const internalDepsCode: Record<string, string> = {};
      for (const [path, slugs] of Object.entries(componentInternalDependencies)) {
        if (typeof slugs === 'string') {
          // Обработка старого формата
          const { data, error } = await supabase.storage
            .from('components')
            .download(`${slugs}-code.tsx`);

          if (error) {
            console.error(`Error loading internal dependency ${slugs}:`, error);
            continue;
          }

          const dependencyCode = await data.text();
          internalDepsCode[`/components/${slugs}.tsx`] = dependencyCode;
        } else if (Array.isArray(slugs)) {
          // Обработка нового формата
          for (const slug of slugs) {
            const { data, error } = await supabase.storage
              .from('components')
              .download(`${slug}-code.tsx`);

            if (error) {
              console.error(`Error loading internal dependency ${slug}:`, error);
              continue;
            }

            const dependencyCode = await data.text();
            internalDepsCode[`/components/${slug}.tsx`] = dependencyCode;
          }
        }
      }
      setInternalDependenciesCode(internalDepsCode);
    }

    fetchInternalDependencies();
  }, [component.internal_dependencies]);

  const handleShareClick = async () => {
    setIsSharing(true);
    const url = `${window.location.origin}/${component.component_slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareButtonText("Copied");
      setTimeout(() => setShareButtonText("Share"), 2000); 
    } catch (err) {
      console.error('Error copying link: ', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-7 rounded-lg p-4 bg-slate-50 h-[90vh] w-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-start justify-center">
          <p className="text-[17px] font-semibold">{component.name}</p>
          <p className="text-[17px] text-gray-600">{component.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleShareClick} disabled={isSharing}>
            {shareButtonText}
            <div className="ml-2 w-5 h-5 flex items-center justify-center">
              <Link size={20} />
            </div>
          </Button>
          <Button onClick={() => setShowCode(!showCode)}>
            {showCode ? 'Canvas' : 'Code'}
            <div className="ml-2 w-5 h-5 flex items-center justify-center">
              {showCode ? <LayoutTemplate /> : <CodeXml />}
            </div>
          </Button>
        </div>
      </div>
      {isClient && (
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