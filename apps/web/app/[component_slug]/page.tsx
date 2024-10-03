import { supabase } from '@/utils/supabase';
import ComponentPreview from '@/components/ComponentPreview'
import { Header } from '../../components/Header';
import React from 'react';
import { headers } from 'next/headers';

async function getComponent(slug: string) {
  try {
    console.log('getComponent called with slug:', slug);
    
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
      .single();

    console.log('Supabase query completed');
    console.log('Fetched component:', component);

    if (error) throw error;

    if (component) {
      console.log('Component user_id:', component.user_id);
      if (component.user) {
        console.log('User found:', component.user);
      } else {
        console.log('User not found for user_id:', component.user_id);
      }
    } else {
      console.log('Component not found for slug:', slug);
    }
    
    return component;
  } catch (error) {
    console.log('Error in getComponent:', error);
    return null;
  }
}

export default async function ComponentPage({ params }: { params: { component_slug: string } }) {
  const headersList = headers();
  console.log('Headers:', headersList);
  console.log('ComponentPage rendered with params:', params);
  
  const component = await getComponent(params.component_slug);

  console.log('Component after getComponent:', component);

  if (!component) {
    console.log('Component not found');
    return <div>Component not found</div>;
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
