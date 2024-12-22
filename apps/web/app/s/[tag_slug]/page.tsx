import { Header } from "@/components/Header"
import { Database } from "@/types/supabase"
import { getComponents } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { SupabaseClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import { TagPageContent } from "./page.client"

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

  if (!tagInfo) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4">
      {tagInfo && <Header tagName={tagInfo?.name} page="components" />}
      <div className="mt-20">
        <TagPageContent components={components} />
      </div>
    </div>
  )
}
