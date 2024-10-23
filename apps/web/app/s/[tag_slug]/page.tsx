import { ComponentsList } from "@/components/ComponentsList"
import { Header } from "@/components/Header"
import { Database } from "@/types/supabase"
import { getComponents } from "@/utils/dbQueries"
import { supabaseWithAdminAccess } from "@/utils/supabase"
import { SupabaseClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"

interface TagPageProps {
  params: {
    tag_slug: string
  }
}

const getTagInfo = async (
  supabase: SupabaseClient<Database>,
  tagSlug: string,
) => {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", tagSlug)
    .single()

  if (error) {
    console.error("Error fetching tag info:", error)
    throw error
  }

  return data
}

export default async function TagPage({ params }: TagPageProps) {
  const tagSlug = params.tag_slug
  const [tagInfo, components] = await Promise.all([
    getTagInfo(supabaseWithAdminAccess, tagSlug),
    getComponents(supabaseWithAdminAccess, tagSlug),
  ])
  console.log(tagInfo)
  console.log(components)
  if (!tagInfo) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4">
      {tagInfo && <Header tagName={tagInfo?.name} page="components" />}
      <ComponentsList components={components} className="mt-20" />
    </div>
  )
}