"use client";

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '../utils/supabase'
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

type FormData = {
  name: string
  component_slug: string
  code: string
  demo_code: string
  description: string
}

export default function ComponentForm() {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>()
  const [isLoading, setIsLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [demoCodeError, setDemoCodeError] = useState<string | null>(null);
  const [parsedDependencies, setParsedDependencies] = useState<Record<string, string>>({});
  const [parsedComponentNames, setParsedComponentNames] = useState<string[]>([]);

  const name = watch('name')
  const componentSlug = watch('component_slug')

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  };

  const isValidSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  };

  const checkSlugUnique = async (slug: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('components')
      .select('id')
      .eq('component_slug', slug);

    if (error) {
      console.error('Error checking slug uniqueness:', error);
      return false;
    }

    return data?.length === 0;
  };

  const generateUniqueSlug = useCallback(async (baseName: string) => {
    let newSlug = generateSlug(baseName);
    let isUnique = await checkSlugUnique(newSlug);
    let suffix = 1;

    while (!isUnique) {
      newSlug = `${generateSlug(baseName)}-${suffix}`;
      isUnique = await checkSlugUnique(newSlug);
      suffix += 1;
    }

    return newSlug;
  }, []);

  useEffect(() => {
    const updateSlug = async () => {
      if (name) {
        const newSlug = await generateUniqueSlug(name);
        setValue('component_slug', newSlug);
        setSlugAvailable(true);
        setSlugError(null);
      }
    };

    updateSlug();
  }, [name, setValue, generateUniqueSlug]);

  useEffect(() => {
    const checkSlug = async () => {
      if (componentSlug) {
        setSlugChecking(true);
        setSlugError(null);

        if (!isValidSlug(componentSlug)) {
          setSlugAvailable(false);
          setSlugError('Invalid slug format');
        } else {
          const isUnique = await checkSlugUnique(componentSlug);
          setSlugAvailable(isUnique);
          if (!isUnique) {
            setSlugError('This slug is not available');
          }
        }

        setSlugChecking(false);
      }
    };

    checkSlug();
  }, [componentSlug]);

  const extractComponentNames = (code: string): string[] => {
    if (!code) return [];
    const matches = code.match(/(?:const|function)\s+([A-Z]\w+)\s*(?:=|\()/g);
    return matches ? matches.map(match => match.split(/\s+/)[1]).filter((name): name is string => Boolean(name)) : [];
  };

  const extractDemoComponentName = (code: string): string => {
    if (!code) return '';
    const match = code.match(/export\s+function\s+([A-Z]\w+)/);
    return match && match[1] ? match[1] : '';
  };

  const [parsedDemoComponentName, setParsedDemoComponentName] = useState('');

  const code = watch('code');
  const demoCode = watch('demo_code');

  useEffect(() => {
    setParsedComponentNames(code ? extractComponentNames(code) : []);
    setParsedDependencies(code ? parseDependencies(code) : {});
  }, [code]);

  useEffect(() => {
    setParsedDemoComponentName(demoCode ? extractDemoComponentName(demoCode) : '');
  }, [demoCode]);

  const checkDemoCode = useCallback((demoCode: string, componentNames: string[]) => {
    const importRegex = new RegExp(`import\\s+{?\\s*(${componentNames.join('|')})\\s*}?\\s+from`);
    if (importRegex.test(demoCode)) {
      setDemoCodeError('Please remove the component import from the demo code. It will be added automatically.');
    } else {
      setDemoCodeError(null);
    }
  }, []);

  useEffect(() => {
    const componentNames = extractComponentNames(code);
    if (componentNames.length > 0 && demoCode) {
      checkDemoCode(demoCode, componentNames);
    }
  }, [code, demoCode, checkDemoCode]);

  function parseDependencies(code: string): Record<string, string> {
    const dependencies: Record<string, string> = {};
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'dynamicImport',
        ],
      });

      const defaultDependencies = ['react', 'react-dom', 'tailwindcss'];

      traverse(ast, {
        ImportDeclaration({ node }) {
          const source = node.source.value;
          if (typeof source === 'string' && !source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@/')) {
            let packageName = source;
            if (!defaultDependencies.includes(packageName)) {
              dependencies[packageName] = 'latest';
            }
          }
        },
      });
    } catch (error) {
      console.error('Error parsing dependencies:', error);
    }

    return dependencies;
  }

  const onSubmit = async (data: FormData) => {
    if (!slugAvailable || demoCodeError) {
      alert('Please choose an available and correct slug before submitting.');
      return;
    }

    setIsLoading(true)
    try {
      const componentNames = extractComponentNames(data.code);
      const demoComponentName = extractDemoComponentName(data.demo_code);
      const dependencies = parseDependencies(data.code);
      
      const codeFileName = `${data.component_slug}-code.tsx`;
      const demoCodeFileName = `${data.component_slug}-demo.tsx`;

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToStorage(codeFileName, data.code),
        uploadToStorage(demoCodeFileName, data.demo_code)
      ]);

      const installUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/r/${data.component_slug}`;
      
      const { error } = await supabase.from('components').insert({
        name: data.name,
        component_name: JSON.stringify(componentNames),
        demo_component_name: demoComponentName,
        component_slug: data.component_slug,
        code: codeUrl,
        demo_code: demoCodeUrl,
        description: data.description,
        install_url: installUrl,
        user_id: "304651f2-9afd-4181-9a20-3263aa601384",
        dependencies: JSON.stringify(dependencies)
      })
    
      if (error) throw error
      
      reset()
      alert('Component added successfully!')
    } catch (error) {
      console.error('Error adding component:', error)
      alert('An error occurred while adding the component')
    } finally {
      setIsLoading(false)
    }
  }

  const uploadToStorage = async (fileName: string, content: string) => {
    const { error } = await supabase.storage
      .from('components')
      .upload(fileName, content, {
        contentType: 'text/plain',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('components')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-[300px]">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <Input id="name" {...register('name', { required: true })} className="mt-1 w-full" />
      </div>

      <div>
        <label htmlFor="component_slug" className="block text-sm font-medium text-gray-700">Component Slug</label>
        <Input id="component_slug" {...register('component_slug', { required: true, validate: isValidSlug })} className="mt-1 w-full" />
        {slugChecking ? (
          <p className="text-gray-500 text-sm mt-1">Checking availability...</p>
        ) : slugError ? (
          <p className="text-red-500 text-sm mt-1">{slugError}</p>
        ) : slugAvailable ? (
          <p className="text-green-500 text-sm mt-1">This slug is available</p>
        ) : null}
      </div>
      
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code</label>
        <Textarea id="code" {...register('code', { required: true })} className="mt-1 w-full" />
      </div>
      
      <div>
        <label htmlFor="demo_code" className="block text-sm font-medium text-gray-700">Demo Code (without component import)</label>
        <Textarea 
          id="demo_code" 
          {...register('demo_code', { required: true })} 
          className={`mt-1 w-full ${demoCodeError ? 'border-red-500' : ''}`}
        />
        {demoCodeError && (
          <p className="text-red-500 text-sm mt-1">{demoCodeError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Parsed Component Names</label>
        <Textarea 
          value={parsedComponentNames.join(', ')}
          readOnly 
          className="mt-1 w-full bg-gray-100" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Parsed Demo Component Name</label>
        <Input value={parsedDemoComponentName} readOnly className="mt-1 w-full bg-gray-100" />
      </div>
    
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Parsed Dependencies</label>
        <Textarea 
          value={Object.entries(parsedDependencies).map(([key, value]) => `${key}: ${value}`).join('\n')}
          readOnly 
          className="mt-1 w-full bg-gray-100" 
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Input id="description" {...register('description', { required: true })} className="mt-1 w-full" />
      </div>
      
      <Button type="submit" disabled={isLoading || !slugAvailable || !!demoCodeError} className="w-full">
        {isLoading ? 'Adding...' : 'Add Component'}
      </Button>
    </form>
  )
}