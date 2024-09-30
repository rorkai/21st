"use client";

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '../utils/supabase'

type FormData = {
  component_name: string
  component_slug: string
  code: string
  demo_code: string
  description: string
}

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

const uploadToStorage = async (fileName: string, content: string) => {
  const { data, error } = await supabase.storage
    .from('components')
    .upload(fileName, content, {
      contentType: 'text/plain',
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('components')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

export default function ComponentForm() {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>()
  const [isLoading, setIsLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)

  const componentName = watch('component_name')
  const componentSlug = watch('component_slug')

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
      if (componentName) {
        const newSlug = await generateUniqueSlug(componentName);
        setValue('component_slug', newSlug);
        setSlugAvailable(true);
        setSlugError(null);
      }
    };

    updateSlug();
  }, [componentName, setValue, generateUniqueSlug]);

  useEffect(() => {
    const checkSlug = async () => {
      if (componentSlug) {
        setSlugChecking(true);
        setSlugError(null);

        if (!isValidSlug(componentSlug)) {
          setSlugAvailable(false);
          setSlugError('Invalid slug format (only lowercase letters, numbers, and "-" are allowed; cannot start or end with "-")');
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

  const onSubmit = async (data: FormData) => {
    if (!slugAvailable) {
      alert('Please choose an available and valid slug before submitting.');
      return;
    }

    setIsLoading(true)
    try {
      const timestamp = new Date().getTime();
      const codeFileName = `components/${data.component_slug}-code-${timestamp}.tsx`;
      const demoCodeFileName = `components/${data.component_slug}-demo-${timestamp}.tsx`;

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToStorage(codeFileName, data.code),
        uploadToStorage(demoCodeFileName, data.demo_code)
      ]);

      const installUrl = `https://yourdomain.com/r/${data.component_slug}`;
      
      const { error } = await supabase.from('components').insert({
        component_name: data.component_name,
        component_slug: data.component_slug,
        code: codeUrl,
        demo_code: demoCodeUrl,
        description: data.description,
        install_url: installUrl,
        user_id: "304651f2-9afd-4181-9a20-3263aa601384"
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-[300px]">
      <div>
        <label htmlFor="component_name" className="block text-sm font-medium text-gray-700">Component Name</label>
        <Input id="component_name" {...register('component_name', { required: true })} className="mt-1 w-full" />
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
        <label htmlFor="demo_code" className="block text-sm font-medium text-gray-700">Demo Code</label>
        <Textarea id="demo_code" {...register('demo_code', { required: true })} className="mt-1 w-full" />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Input id="description" {...register('description', { required: true })} className="mt-1 w-full" />
      </div>
      
      <Button type="submit" disabled={isLoading || !slugAvailable} className="w-full">
        {isLoading ? 'Adding...' : 'Add Component'}
      </Button>
    </form>
  )
}