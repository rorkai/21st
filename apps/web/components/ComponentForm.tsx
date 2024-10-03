"use client";

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '../utils/supabase'
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { Alert } from "@/components/ui/alert"
import { useAtom } from 'jotai';
import {
  slugAvailableAtom,
  slugCheckingAtom,
  slugErrorAtom,
  demoCodeErrorAtom,
  parsedDependenciesAtom,
  parsedComponentNamesAtom,
  parsedDemoDependenciesAtom,
  internalDependenciesAtom,
  importsToRemoveAtom,
  parsedDemoComponentNameAtom
} from '@/lib/atoms';

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
  const [slugAvailable, setSlugAvailable] = useAtom(slugAvailableAtom)
  const [slugChecking, setSlugChecking] = useAtom(slugCheckingAtom)
  const [slugError, setSlugError] = useAtom(slugErrorAtom)
  const [demoCodeError, setDemoCodeError] = useAtom(demoCodeErrorAtom)
  const [parsedDependencies, setParsedDependencies] = useAtom(parsedDependenciesAtom)
  const [parsedComponentNames, setParsedComponentNames] = useAtom(parsedComponentNamesAtom)
  const [parsedDemoDependencies, setParsedDemoDependencies] = useAtom(parsedDemoDependenciesAtom)
  const [internalDependencies, setInternalDependencies] = useAtom(internalDependenciesAtom)
  const [importsToRemove, setImportsToRemove] = useAtom(importsToRemoveAtom)
  const [parsedDemoComponentName, setParsedDemoComponentName] = useAtom(parsedDemoComponentNameAtom)

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
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    
    const exportedComponents: string[] = [];
    
    traverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration;
        if (declaration) {
          if (t.isFunctionDeclaration(declaration) && declaration.id) {
            exportedComponents.push(declaration.id.name);
          } else if (t.isVariableDeclaration(declaration)) {
            declaration.declarations.forEach(d => {
              if (t.isIdentifier(d.id)) {
                exportedComponents.push(d.id.name);
              }
            });
          } else if (t.isClassDeclaration(declaration) && declaration.id) {
            exportedComponents.push(declaration.id.name);
          }
        } else if (path.node.specifiers) {
          path.node.specifiers.forEach(specifier => {
            if (t.isExportSpecifier(specifier)) {
              if (t.isIdentifier(specifier.exported)) {
                exportedComponents.push(specifier.exported.name);
              }
            }
          });
        }
      },
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;
        if (t.isIdentifier(declaration)) {
          exportedComponents.push(declaration.name);
        } else if (t.isFunctionDeclaration(declaration) && declaration.id) {
          exportedComponents.push(declaration.id.name);
        } else if (t.isClassDeclaration(declaration) && declaration.id) {
          exportedComponents.push(declaration.id.name);
        }
      },
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id) && 
            t.isVariableDeclaration(path.parent) &&
            path.parentPath && t.isExportNamedDeclaration(path.parentPath.parent)) {
          exportedComponents.push(path.node.id.name);
        }
      }
    });
    
    return exportedComponents;
  };

  const extractDemoComponentName = (code: string): string => {
    if (!code) return '';
    const match = code.match(/export\s+function\s+([A-Z]\w+)/);
    return match && match[1] ? match[1] : '';
  };

  const code = watch('code');
  const demoCode = watch('demo_code');

  useEffect(() => {
    setParsedComponentNames(code ? extractComponentNames(code) : []);
    setParsedDependencies(code ? parseDependencies(code) : {});
    setParsedDemoDependencies(demoCode ? parseDependencies(demoCode) : {});
  }, [code, demoCode]);

  useEffect(() => {
    setParsedDemoComponentName(demoCode ? extractDemoComponentName(demoCode) : '');
  }, [demoCode]);

  const removeComponentImports = (demoCode: string, componentNames: string[]): { modifiedCode: string, removedImports: string[] } => {
    const ast = parse(demoCode, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const importsToDrop: { start: number; end: number; text: string }[] = [];

    traverse(ast, {
      ImportDeclaration(path) {
        const specifiers = path.node.specifiers;
        const importedNames = specifiers.map(s => t.isImportSpecifier(s) && t.isIdentifier(s.imported) ? s.imported.name : '');
        
        if (importedNames.some(name => componentNames.includes(name))) {
          importsToDrop.push({
            start: path.node.start!,
            end: path.node.end!,
            text: demoCode.slice(path.node.start!, path.node.end!)
          });
        }
      }
    });

    let modifiedCode = demoCode;
    const removedImports: string[] = [];
    for (let i = importsToDrop.length - 1; i >= 0; i--) {
      const importToDrop = importsToDrop[i];
      if (importToDrop) {
        const { start, end, text } = importToDrop;
        modifiedCode = modifiedCode.slice(0, start) + modifiedCode.slice(end);
        removedImports.push(text);
      }
    }

    return { modifiedCode: modifiedCode.trim(), removedImports };
  };

  const checkDemoCode = useCallback((demoCode: string, componentNames: string[]) => {
    const { modifiedCode, removedImports } = removeComponentImports(demoCode, componentNames);
    
    if (removedImports.length > 0) {
      setImportsToRemove(removedImports);
      setDemoCodeError('Component imports in the Demo component are automatic. Please confirm deletion.');
    } else {
      setImportsToRemove([]);
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
          const importDeclaration = node as t.ImportDeclaration;
          const source = importDeclaration.source.value;
          if (typeof source === 'string' && !source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@/')) {
            let packageName = source;
            if (!defaultDependencies.includes(packageName)) {
              dependencies[packageName] = 'latest';
            }
          }
        },
        ImportNamespaceSpecifier(path) {
          const importDeclaration = path.findParent((p) => p.isImportDeclaration());
          if (importDeclaration && t.isImportDeclaration(importDeclaration.node)) {
            const source = importDeclaration.node.source.value;
            if (typeof source === 'string' && !source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@/')) {
              let packageName = source;
              if (!defaultDependencies.includes(packageName)) {
                dependencies[packageName] = 'latest';
              }
            }
          }
        },
      });
    } catch (error) {
      console.error('Error parsing dependencies:', error);
    }

    return dependencies;
  }

  function parseInternalDependencies(code: string): Record<string, string> {
    const internalDeps: Record<string, string> = {};
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

      traverse(ast, {
        ImportDeclaration({ node }) {
          const source = node.source.value;
          if (typeof source === 'string' && source.startsWith('@/components/')) {
            internalDeps[source] = '';
          }
        },
      });
    } catch (error) {
      console.error('Error parsing internal dependencies:', error);
    }

    return internalDeps;
  }

  useEffect(() => {
    const componentDeps = parseInternalDependencies(code);
    const demoDeps = parseInternalDependencies(demoCode);
    
    const combinedDeps = { ...componentDeps, ...demoDeps };
    
    setInternalDependencies(combinedDeps);
  }, [code, demoCode]);

  const handleApproveDelete = () => {
    const { modifiedCode } = removeComponentImports(demoCode, parsedComponentNames);
    setValue('demo_code', modifiedCode);
    setImportsToRemove([]);
    setDemoCodeError(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!slugAvailable || demoCodeError) {
      alert('Please choose an available and correct slug before submitting.');
      return;
    }

    if (Object.values(internalDependencies).some(slug => !slug)) {
      alert('Please specify the slug for all internal dependencies');
      return;
    }

    let modifiedCode = data.code;
    let modifiedDemoCode = data.demo_code;
    Object.entries(internalDependencies).forEach(([path, slug]) => {
      const regex = new RegExp(`from\\s+["']${path}["']`, 'g');
      const replacement = `from "@/components/${slug}"`;
      modifiedCode = modifiedCode.replace(regex, replacement);
      modifiedDemoCode = modifiedDemoCode.replace(regex, replacement);
    });

    setIsLoading(true)
    try {
      const componentNames = extractComponentNames(modifiedCode);
      const demoComponentName = extractDemoComponentName(modifiedDemoCode);
      const dependencies = parseDependencies(modifiedCode);
      
      const cleanedDemoCode = removeComponentImports(modifiedDemoCode, componentNames).modifiedCode;

      const codeFileName = `${data.component_slug}-code.tsx`;
      const demoCodeFileName = `${data.component_slug}-demo.tsx`;

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToStorage(codeFileName, modifiedCode),
        uploadToStorage(demoCodeFileName, cleanedDemoCode)
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
        dependencies: JSON.stringify(dependencies),
        demo_dependencies: JSON.stringify(parsedDemoDependencies),
        internal_dependencies: JSON.stringify(internalDependencies)
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
          className={`mt-1 w-full ${demoCodeError ? 'border-yellow-500' : ''}`}
        />
        {demoCodeError && (
          <Alert variant="default" className="mt-2 text-[14px]">
            <p>{demoCodeError}</p>
            {importsToRemove.map((importStr, index) => (
              <div key={index} className="bg-gray-100 p-2 mt-2 rounded flex flex-col">
                <code className="mb-2">{importStr}</code>
                <Button onClick={handleApproveDelete} size="sm" className="self-end">Delete</Button>
              </div>
            ))}
          </Alert>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Components Names</label>
        <Textarea 
          value={parsedComponentNames.join(', ')}
          readOnly 
          className="mt-1 w-full bg-gray-100" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Demo Component Name</label>
        <Input value={parsedDemoComponentName} readOnly className="mt-1 w-full bg-gray-100" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Component Dependencies</label>
        <Textarea 
          value={Object.entries(parsedDependencies).map(([key, value]) => `${key}: ${value}`).join('\n')}
          readOnly 
          className="mt-1 w-full bg-gray-100" 
        />
      </div>
    
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Demo Dependencies</label>
        <Textarea 
          value={Object.entries(parsedDemoDependencies).map(([key, value]) => `${key}: ${value}`).join('\n')}
          readOnly 
          className="mt-1 w-full bg-gray-100" 
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Input id="description" {...register('description', { required: true })} className="mt-1 w-full" />
      </div>
      
      {Object.keys(internalDependencies).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Internal dependencies:</h3>
          {Object.entries(internalDependencies).map(([path, slug]) => (
            <div key={path} className="mb-2">
              <label className="block text-sm font-medium text-gray-700">{path}</label>
              <Input
                value={slug}
                onChange={(e) => {
                  setInternalDependencies(prev => ({...prev, [path]: e.target.value}));
                }}
                placeholder="Enter component slug"
                className="mt-1 w-full"
              />
            </div>
          ))}
        </div>
      )}
      
      <Button type="submit" disabled={isLoading || !slugAvailable || !!demoCodeError} className="w-full">
        {isLoading ? 'Adding...' : 'Add Component'}
      </Button>
    </form>
  )
}