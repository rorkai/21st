import { Header } from '../components/Header';
import React from 'react';
import { ComponentBento } from '../components/ComponentBento';
import { getComponents } from '@/utils/dataFetchers';

export default async function HomePage() {
  const components = await getComponents();

  return (
    <>
      <Header />
      <div className="container mx-auto mt-7">
        <ComponentBento components={components || []} />
      </div>
    </>
  );
}
