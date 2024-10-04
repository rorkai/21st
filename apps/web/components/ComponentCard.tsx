/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Heart, Download } from "lucide-react";
import ComponentPreviewImage from "./ComponentPreviewImage";
import { Component } from '../types/types';
import { UserAvatar } from "./UserAvatar";

interface ComponentCardProps {
  component: Component;
}

export function ComponentCard({ component }: ComponentCardProps) {
  const previewClass = getPreviewClass(component.size);
  const isPlaceholder = component.preview_url === "/placeholder.svg";

  // Create URL with possible absence of user
  const componentUrl = `/${component.user.username}/${component.component_slug}`

  return (
    <Link href={componentUrl} className="block h-full">
      <div className="h-full flex flex-col rounded-lg hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden">
        <div className={`relative ${previewClass} ${isPlaceholder ? "" : ""}`}>
          <ComponentPreviewImage
            src={component.preview_url || "/placeholder.svg"}
            alt={component.name}
            fallbackSrc="/placeholder.svg"
            className="w-full h-full"
          />
        </div>
        <div className="bg-white px-4 py-2 flex items-center justify-between flex-grow">
          <div className="flex gap-3 items-center h-full w-full">
              <div className="flex-shrink-0">
                <UserAvatar src={component.user.image_url} alt={component.user.name} size={32} />
              </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-800 truncate">
                {component.name}
              </h2>
              <p className="text-sm text-gray-600 line-clamp-2">
                {component.description}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-gray-600">
                <Heart className="w-4 h-4 mr-1" />
                <span className="text-xs">{component.likes_count || 0}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Download className="w-4 h-4 mr-1" />
                <span className="text-xs">
                  {component.downloads_count || 0}
                </span>
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
    case "1x1":
      return "max-h-[200px]";
    case "1x2":
      return "max-h-[520px]";
    case "2x1":
      return "max-h-[200px]";
    case "2x2":
      return "max-h-[520px]";
    default:
      return "max-h-[200px]";
  }
}
