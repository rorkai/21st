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
}

export default function ComponentPreview({ component }: { component: Component }) {
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [dependencies, setDependencies] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);

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
      const updatedDemoCode = `import { ${component.component_name} } from "./${component.component_slug}";\n${rawDemoCode}`;
      setDemoCode(updatedDemoCode);

      // Парсим зависимости из JSON
      const componentDependencies = JSON.parse(component.dependencies || '{}');
      setDependencies(componentDependencies);
    }

    fetchCode();
  }, [component.component_slug, component.component_name, component.dependencies]);

  const demoComponentName = component.demo_component_name;

  const files = {
    "/App.tsx": `
import React from 'react';
import { ${demoComponentName} } from './Demo';

export default function App() {
  return (
    <div className="p-4">
      <${demoComponentName} />
    </div>
  );
}
  `,
    [`/${component.component_slug}.tsx`]: code,
    "/Demo.tsx": demoCode,
    // Удалите "/index.tsx" и "/styles.css" отсюда, так как они теперь определены в SandpackProviderClient
  };

  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h2 className="text-xl font-semibold mb-2">{component.name}</h2>
      <p className="text-gray-600 mb-4">{component.description}</p>
      {isClient && (
        <SandpackProviderClient
          files={files}
          dependencies={dependencies}
          demoComponentName={demoComponentName}
        />
      )}
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Component Details:</h3>
        <p><strong>ID:</strong> {component.id}</p>
        <p><strong>Name:</strong> {component.name}</p>
        <p><strong>Slug:</strong> {component.component_slug}</p>
        <p><strong>Extracted Name:</strong> {component.component_name}</p>
        <p><strong>Demo Component Name:</strong> {component.demo_component_name}</p>
        <p><strong>Install URL:</strong> {component.install_url}</p>
        <p><strong>Created At:</strong> {new Date(component.created_at).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(component.updated_at).toLocaleString()}</p>
        <p><strong>Public:</strong> {component.is_public ? 'Yes' : 'No'}</p>
        <p><strong>Downloads:</strong> {component.downloads_count}</p>
        <p><strong>Likes:</strong> {component.likes_count}</p>
        <p><strong>Dependencies:</strong> {component.dependencies}</p>
      </div>
    </div>
  );
}