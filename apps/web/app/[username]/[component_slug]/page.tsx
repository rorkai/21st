import { supabase } from '@/utils/supabase';
import ComponentPreview from '@/components/ComponentPreview'
import { Header } from '@/components/Header';
import React from 'react';
import { notFound } from 'next/navigation';

async function getComponent(username: string, slug: string) {
  try {
    console.log('getComponent called with username:', username, 'and slug:', slug);
    
    const { data: component, error } = await supabase
      .from('components')
      .select(`
        *,
        users:users!user_id (
          id,
          username,
          image_url,
          name,
          email
        )
      `)
      .eq('component_slug', slug)
      .eq('users.username', username)
      .single();

    if (error) {
      console.error('Error fetching component:', error);
      return null;
    }
    
    return component;
  } catch (error) {
    console.error('Error in getComponent:', error);
    return null;
  }
}

export default async function ComponentPage({ params }: { params: { username: string, component_slug: string } }) {
  const { username, component_slug } = params;
  
  console.log('ComponentPage called with params:', params);

  const component = await getComponent(username, component_slug);

  if (!component) {
    console.log('Component not found, redirecting to 404');
    notFound();
  }

  return (
    <>
      <Header componentSlug={component.component_slug} isPublic={component.is_public} />
      <div className="w-full ">
        <ComponentPreview component={component} />
      </div>
    </>
  );
}
