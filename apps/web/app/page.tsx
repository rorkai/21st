import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Download } from 'lucide-react';
import { Header } from '../components/Header';
import React from 'react';

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
      <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Component Library</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {components.map((component) => (
          <Link href={`/${component.component_slug}`} key={component.id} className="block ">
          
            
         
                <div className="aspect-[2/1] relative">
                  <Image
                    src="/placeholder.svg"
                    alt={component.name}
                    fill
                    className="object-cover rounded-lg hover:shadow-lg transition-shadow"
                  />
                </div>
                
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex-grow">
                      <h2 className="text-lg font-semibold">{component.name}</h2>
                      <p className="text-sm text-gray-600 mt-[2px]">{component.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-gray-600">
                        <Heart className="w-4 h-4 mr-1" />
                        <span className="text-xs">{component.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Download className="w-4 h-4 mr-1" />
                        <span className="text-xs">{component.downloads_count || 0}</span>
                      </div>
                    </div>
                  </div>
            
          
        
          </Link>
        ))}
      </div>
      </div>
    </>
  );
}
