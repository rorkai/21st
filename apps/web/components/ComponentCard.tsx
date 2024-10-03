/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Heart, Download } from "lucide-react";
import ComponentPreviewImage from "./ComponentPreviewImage";
import { Component } from '../types/types';

interface ComponentCardProps {
  component: Component;
}

export function ComponentCard({ component }: ComponentCardProps) {
  const previewClass = getPreviewClass(component.size);
  const isPlaceholder = component.preview_url === "/placeholder.svg";

  // Создаем URL с учетом возможного отсутствия user
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
        <div className="bg-white p-4 flex items-center justify-between flex-grow">
          <div className="flex gap-3 items-center h-full w-full">
              <div className="flex-shrink-0">
                <img
                  src={`${component.user.image_url}&size=64`}
                  alt={`${component.user.username}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 truncate">
                {component.name}
              </h2>
              <p className="text-sm text-gray-600 mt-[2px] line-clamp-2">
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
      return "h-[200px]";
    case "1x2":
      return "h-[400px]";
    case "2x1":
      return "h-[200px]";
    case "2x2":
      return "h-[400px]";
    default:
      return "h-[200px]";
  }
}
