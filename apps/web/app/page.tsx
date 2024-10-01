import { supabase } from '@/utils/supabase';
import Link from 'next/link';

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
            <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{component.name}</h2>
              <p className="text-gray-600 mb-2">ID: {component.id}</p>
              <p className="text-gray-600 mb-4">{component.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
