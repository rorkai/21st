import Link from 'next/link';
import { Heart, Download } from 'lucide-react';
import ComponentPreviewImage from './ComponentPreviewImage';

interface ComponentCardProps {
  component: {
    id: string;
    component_slug: string;
    name: string;
    description: string;
    preview_url: string;
    likes_count: number;
    downloads_count: number;
    size: string;
  };
}

export function ComponentCard({ component }: ComponentCardProps) {
  const previewClass = getPreviewClass(component.size);
  const isPlaceholder = component.preview_url === "/placeholder.svg";

  return (
    <Link href={`/${component.component_slug}`} className="block h-full">
      <div className="h-full flex flex-col rounded-lg hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
        <div className={`relative ${previewClass} ${isPlaceholder ? '' : ''}`}>
          <ComponentPreviewImage
            src={component.preview_url || "/placeholder.svg"}
            alt={component.name}
            fallbackSrc="/placeholder.svg"
            className="w-full h-full"
          />
        </div>
        <div className="bg-white p-4 flex items-center justify-between flex-grow">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 truncate">{component.name}</h2>
            <p className="text-sm text-gray-600 mt-[2px] line-clamp-2">{component.description}</p>
          </div>
          <div className="flex justify-between items-center mt-3">
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
        </div>
      </div>
    </Link>
  );
}

function getPreviewClass(size: string): string {
  switch (size) {
    case '1x1': return 'h-[200px]';
    case '1x2': return 'h-[400px]';
    case '2x1': return 'h-[200px]';
    case '2x2': return 'h-[400px]';
    default: return 'h-[200px]';
  }
}