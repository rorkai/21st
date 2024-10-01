"use client";

import React, { useState, useEffect } from 'react';
import { SandpackProvider, SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from "@codesandbox/sandpack-react";
import { supabase } from '@/utils/supabase';

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

  useEffect(() => {
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
      setDemoCode(await demoData.text());
    }

    fetchCode();
  }, [component.component_slug]);

  const componentName = component.component_name;
  const demoComponentName = component.demo_component_name;

  const files = {
    "/App.tsx": `
import React from 'react';
import { ${demoComponentName} } from './Demo';
import { ${componentName} } from './${component.component_slug}';

export default function App() {
  return (
    <div>
      <${demoComponentName} />
    </div>
  );
}
    `,
    [`/${component.component_slug}.tsx`]: code,
    "/Demo.tsx": demoCode,
    "/index.tsx": `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
    `,
    "/styles.css": `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
      
      @layer base {
        :root {
          --background: 0 0% 100%;
          --foreground: 240 10% 3.9%;
          --card: 0 0% 100%;
          --card-foreground: 240 10% 3.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 240 10% 3.9%;
          --primary: 240 5.9% 10%;
          --primary-foreground: 0 0% 98%;
          --secondary: 240 4.8% 95.9%;
          --secondary-foreground: 240 5.9% 10%;
          --muted: 240 4.8% 95.9%;
          --muted-foreground: 240 3.8% 45%;
          --accent: 240 4.8% 95.9%;
          --accent-foreground: 240 5.9% 10%;
          --destructive: 0 72% 51%;
          --destructive-foreground: 0 0% 98%;
          --border: 240 5.9% 90%;
          --input: 240 5.9% 90%;
          --ring: 240 5.9% 10%;
          --radius: 0.5rem;
        }
      }
      
      @layer base {
        * {
          @apply border-border;
        }
        body {
          @apply bg-background text-foreground font-body;
        }
        h1, h2, h3, h4, h5, h6 {
          @apply font-heading;
        }
      }
    `,
    "/lib/utils.ts": `
export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
    `,
  };

  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h2 className="text-xl font-semibold mb-2">{component.name}</h2>
      <p className="text-gray-600 mb-4">{component.description}</p>
      <SandpackProvider
        theme="dark"
        template="react-ts"
        files={files}
        customSetup={{
          entry: "/index.tsx",
          dependencies: {
            "react": "^18.0.0",
            "react-dom": "^18.0.0",
            "tailwindcss": "^3.0.0"
          },
        }}
        options={{
          classes: {
            "sp-wrapper": "custom-wrapper",
            "sp-layout": "custom-layout",
            "sp-tab-button": "custom-tab",
          },
          externalResources: [
            "https://cdn.tailwindcss.com"
          ],
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