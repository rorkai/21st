import { Component, User, Tag } from "@/types/global"
import { ComponentVideoPreview } from "./ComponentVideoPreview"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { Video, Crown } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"

interface ComponentPageProPreviewProps {
  component: Component & { user: User } & { tags: Tag[] }
}

export function ComponentPageProPreview({
  component,
}: ComponentPageProPreviewProps) {
  // Моковые данные для тестирования
  const mockData = {
    buyUrl: "https://example.com/buy",
    bundleUrl: "https://example.com/bundle",
    price: 9,
  }

  // Создаем массив из 120 элементов для сетки
  const gridItems = Array.from({ length: 120 }, (_, i) => i)

  return (
    <div className="flex w-full !flex-grow">
      <div className="w-[70%] relative">
        <div className="relative flex items-center justify-center h-full w-full m-auto p-16 bg-background text-foreground">
          <div className="absolute lab-bg inset-0 size-full bg-[radial-gradient(#00000021_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative h-[40vh] aspect-[4/3] rounded-lg overflow-hidden group">
            <div className="relative w-full h-full">
              <div className="absolute inset-0" style={{ margin: "-1px" }}>
                <ComponentPreviewImage
                  src={component.preview_url || "/placeholder.svg"}
                  alt={component.name}
                  fallbackSrc="/placeholder.svg"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {component.video_url && (
              <ComponentVideoPreview component={component} />
            )}
            {component.video_url && (
              <div
                className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-md px-2 py-1 pointer-events-none"
                data-video-icon={`${component.id}`}
              >
                <Video size={16} className="text-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-[30%] py-4 md:py-10 bg-[linear-gradient(to_right,transparent_1%,var(--gray-50)_10%,var(--gray-50)_90%,transparent_99%)] dark:bg-[linear-gradient(to_right,transparent_0%,var(--neutral-950)_10%,var(--neutral-950)_90%,transparent_100%)] overflow-hidden relative">
        {/* Фоновая сетка */}
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-50">
          <div className="flex bg-gray-200 dark:bg-neutral-700 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
            {gridItems.map((i) => (
              <div
                key={i}
                className={`w-10 h-10 flex flex-shrink-0 rounded-[1px] bg-gray-100 dark:bg-neutral-800 ${
                  i % 2 === 0
                    ? "shadow-[0px_0px_0px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_0px_3px_rgba(0,0,0,0.2)_inset]"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Обновленный контент */}
        <div className="relative flex flex-col items-center justify-center h-full px-6 space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <Crown className="w-8 h-8 text-primary" />
            <span className="text-lg font-medium">Pro</span>
          </div>

          <Button asChild size="sm" className="w-[180px]">
            <Link href={mockData.buyUrl}>Buy for ${mockData.price}</Link>
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-1">
            or get this with{" "}
            <Link
              href={mockData.bundleUrl}
              className="font-bold hover:underline"
            >
              the bundle
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
