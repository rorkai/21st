/* eslint-disable @next/next/no-img-element */
"use client"

import { Video, Eye, Heart } from "lucide-react"
import Link from "next/link"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsActivityType } from "@/types/global"

import { Component, User, DemoWithComponent } from "../types/global"
import ComponentPreviewImage from "./ComponentPreviewImage"
import { ComponentVideoPreview } from "./ComponentVideoPreview"
import { CopyComponentButton } from "./CopyComponentButton"
import { UserAvatar } from "./UserAvatar"

export function ComponentCardSkeleton() {
  return (
    <div className="overflow-hidden animate-pulse">
      <div className="relative aspect-[4/3] mb-3">
        <div className="absolute inset-0 rounded-lg overflow-hidden bg-muted" />
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 rounded-full bg-muted" />
        <div className="flex items-center justify-between flex-grow min-w-0">
          <div className="min-w-0 flex-1 mr-3">
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
          <div className="h-3 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function ComponentCard({
  component,
  demo,
  isLoading,
}: {
  component?: Component & { user: User }
  demo?: DemoWithComponent
  isLoading?: boolean
}) {
  if (isLoading || (!component && !demo)) {
    return <ComponentCardSkeleton />
  }

  const componentData = demo ? demo.component : component!
  const userData = demo ? demo.user : component!.user

  const componentUrl = `/${userData.username}/${componentData.component_slug}${demo ? `/${demo.id}` : ""}`
  const supabase = useClerkSupabaseClient()

  const { data: analytics } = useQuery({
    queryKey: ["component-analytics", componentData.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("mv_component_analytics")
        .select("component_id, count")
        .eq("component_id", componentData.id)
        .eq("activity_type", AnalyticsActivityType.COMPONENT_VIEW)
      return data
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  return (
    <div className="overflow-hidden">
      <Link href={componentUrl} className="block cursor-pointer">
        <div className="relative aspect-[4/3] mb-3 group">
          <CopyComponentButton
            codeUrl={componentData.code}
            component={{ ...componentData, user: userData }}
          />
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className="relative w-full h-full">
              <div className="absolute inset-0" style={{ margin: "-1px" }}>
                <ComponentPreviewImage
                  src={
                    demo?.preview_url ||
                    componentData.preview_url ||
                    "/placeholder.svg"
                  }
                  alt={demo?.name || componentData.name}
                  fallbackSrc="/placeholder.svg"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 to-foreground/5" />
            </div>
            {(demo?.video_url || componentData.video_url) && (
              <ComponentVideoPreview
                component={{ ...componentData, user: userData }}
                demo={demo}
              />
            )}
          </div>
          {(demo?.video_url || componentData.video_url) && (
            <div
              className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur rounded-md px-2 py-1 pointer-events-none"
              data-video-icon={`${componentData.id}`}
            >
              <Video size={16} className="text-foreground" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-center space-x-3">
        <UserAvatar
          src={userData.image_url || "/placeholder.svg"}
          alt={userData.name}
          size={24}
          user={userData}
          isClickable
        />
        <div className="flex items-center justify-between flex-grow min-w-0">
          <Link
            href={componentUrl}
            className="block cursor-pointer min-w-0 flex-1 mr-3"
          >
            <h2 className="text-sm font-medium text-foreground truncate">
              {demo?.name || componentData.name}
            </h2>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap shrink-0 gap-1">
              <Eye size={14} />
              <span>{analytics?.[0]?.count || 0}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap shrink-0 gap-1">
              <Heart size={14} className="text-muted-foreground" />
              <span>{componentData.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
