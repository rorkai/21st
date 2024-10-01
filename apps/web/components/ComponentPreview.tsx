"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/utils/supabase';

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
  internal_dependencies: string; // Новое поле
}

export default function ComponentPreview({ component }: { component: Component }) {
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [dependencies, setDependencies] = useState<Record<string, string>>({});
  const [demoDependencies, setDemoDependencies] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);
  const [internalDependencies, setInternalDependencies] = useState<Record<string, string>>({});
  const [internalDependenciesCode, setInternalDependenciesCode] = useState<Record<string, string>>({});

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
    <div className="flex justify-center items-center h-screen p-4">
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
      for (const [path, slug] of Object.entries(componentInternalDependencies)) {
        const { data, error } = await supabase.storage
          .from('components')
          .download(`${slug}-code.tsx`);

        if (error) {
          console.error(`Ошибка при загрузке внутренней зависимости ${slug}:`, error);
          continue;
        }

        const dependencyCode = await data.text();
        internalDepsCode[`/components/${slug}.tsx`] = dependencyCode;
      }
      setInternalDependenciesCode(internalDepsCode);
    }

    fetchInternalDependencies();
  }, [component.internal_dependencies]);

  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h2 className="text-xl font-semibold mb-2">{component.name}</h2>
      <p className="text-gray-600 mb-4">{component.description}</p>
      {isClient && (
        <SandpackProviderClient
          files={files}
          dependencies={dependencies}
          demoDependencies={demoDependencies}
          demoComponentName={demoComponentName}
          internalDependencies={internalDependenciesCode}
        />
      )}
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Component Details:</h3>
        <p><strong>ID:</strong> {component.id}</p>
        <p><strong>Name:</strong> {component.name}</p>
        <p><strong>Slug:</strong> {component.component_slug}</p>
        <p><strong>Extracted Names:</strong> {parseComponentNames(component.component_name).join(', ')}</p>
        <p><strong>Demo Component Name:</strong> {component.demo_component_name}</p>
        <p><strong>Install URL:</strong> {component.install_url}</p>
        <p><strong>Created At:</strong> {new Date(component.created_at).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(component.updated_at).toLocaleString()}</p>
        <p><strong>Public:</strong> {component.is_public ? 'Yes' : 'No'}</p>
        <p><strong>Downloads:</strong> {component.downloads_count}</p>
        <p><strong>Likes:</strong> {component.likes_count}</p>
        <p><strong>Dependencies:</strong> {component.dependencies}</p>
        <p><strong>Demo Dependencies:</strong> {component.demo_dependencies}</p>
        <p><strong>Internal Dependencies:</strong> {component.internal_dependencies}</p>
      </div>
    </div>
  );
}

function parseComponentNames(componentName: string): string[] {
  try {
    return JSON.parse(componentName);
  } catch {
    // Если разбор JSON не удался, предполагаем, что это одиночное имя компонента
    return [componentName];
  }
}