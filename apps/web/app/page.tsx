import { supabase } from '@/utils/supabase';
import { Header } from '../components/Header';
import React from 'react';
import { ComponentBento } from '../components/ComponentBento';

async function getComponents() {
  const { data, error } = await supabase
    .from('components')
    .select('*')

  if (error) throw error;
  return data || [];
}

export default async function HomePage() {
  const components = await getComponents();

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 h-full">
        <h1 className="text-2xl font-bold mb-4">Component Library</h1>
        <ComponentBento components={components} />
      </div>
    </>
  );
}
