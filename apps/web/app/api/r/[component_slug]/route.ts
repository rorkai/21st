import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { component_slug: string } }
) {
  const component_slug = params.component_slug;

  const { data: component, error } = await supabase
    .from('components')
    .select('*')
    .eq('component_slug', component_slug)
    .single();

  if (error || !component) {
    return NextResponse.json({ error: 'Component not found' }, { status: 404 });
  }

  const codePath = `${component_slug}-code.tsx`;

  const { data: codeContent, error: codeError } = await supabase.storage
    .from('components')
    .download(codePath);

  if (codeError) {
    console.error('Error loading component code:', codeError);
    return NextResponse.json({ error: 'Error loading component code' }, { status: 500 });
  }

  const code = await codeContent.text();

  const escapedCode = code
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');

  const responseData = {
    name: component_slug,
    type: 'registry:ui',
    files: [
      {
        path: `magicui/${component_slug}.tsx`,
        content: `"${escapedCode}"`,
        type: 'registry:ui',
        target: '',
      },
    ],
  };

  return NextResponse.json(responseData);
}