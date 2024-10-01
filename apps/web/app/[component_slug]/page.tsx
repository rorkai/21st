import { supabase } from '@/utils/supabase';
import ComponentPreview from '@/components/ComponentPreview'

async function getComponent(slug: string) {
  const { data, error } = await supabase
    .from('components')
    .select('*')
    .eq('component_slug', slug)
    .single();

  if (error) {
    console.error('Error fetching component:', error);
    return null;
  }
  return data;
}

export default async function ComponentPage({ params }: { params: { component_slug: string } }) {
  const component = await getComponent(params.component_slug);

  if (!component) {
    return <div>Component not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{component.name}</h1>
      <ComponentPreview component={component} />
    </div>
  );
}