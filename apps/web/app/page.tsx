import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Download } from 'lucide-react';

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Component Library</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((component) => (
          <Link href={`/${component.component_slug}`} key={component.id}>
            <div className="border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full h-[150px]">
                <Image
                  src="/placeholder.svg"
                  alt={component.name}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{component.name}</h2>
                    <p className="text-gray-600 mt-1">{component.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-600">
                      <Heart className="w-5 h-5 mr-1" />
                      <span>{component.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Download className="w-5 h-5 mr-1" />
                      <span>{component.downloads_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
