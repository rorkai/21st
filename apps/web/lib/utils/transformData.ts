import { Component, DemoWithComponent, User, Tag } from "@/types/global"

export const transformDemoResult = (result: any): DemoWithComponent => {
  const transformed = {
    id: result.id,
    name: result.name,
    demo_code: result.demo_code,
    preview_url: result.preview_url,
    video_url: result.video_url,
    compiled_css: result.compiled_css,
    demo_dependencies: result.demo_dependencies,
    demo_direct_registry_dependencies: result.demo_direct_registry_dependencies,
    demo_slug: result.demo_slug,
    component_id: result.component_id,
    user_id: (result.user_data as User).id,
    pro_preview_image_url: result.pro_preview_image_url,
    created_at: result.created_at,
    updated_at: result.updated_at,
    fts: result.fts,
    component: {
      ...(result.component_data as Component),
      user: result.component_user_data as User,
    } as Component & { user: User },
    user: result.user_data as User,
    tags: (result.tags as Tag[]) || [],
  }
  return transformed
}
