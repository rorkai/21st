import { Header } from '../components/Header';
import React from 'react';
import { ComponentBento } from '../components/ComponentBento';
import { getComponents } from '@/utils/dataFetchers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Component Library',
};

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
