export interface User {
  id: string
  username: string
  image_url?: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Component {
  id: number
  component_name: any // jsonb
  description: string
  code: string
  demo_code: string
  created_at: string
  updated_at: string
  user_id: string
  install_url: string
  dependencies: any // jsonb т
  is_public: boolean
  downloads_count: number
  likes_count: number
  component_slug: string
  demo_component_name: string
  name: string
  demo_dependencies: any // jsonb
  internal_dependencies: any // jsonb
  preview_url: string
  license: string
  user: User
  tags: Tag[]
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface ComponentTag {
  component_id: number
  tag_id: number
}
