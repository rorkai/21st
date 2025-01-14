import Link from "next/link"
import Image from "next/image"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { Download, Eye } from "lucide-react"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Top authors | 21st.dev",
}

export default async function AuthorsPage() {
  const { data: authors, error } = await supabaseWithAdminAccess
    .from("users")
    .select(
      `
      id,
      username,
      name,
      image_url,
      bio,
      components!components_user_id_fkey(
        id,
        downloads_count,
        mv_component_analytics!component_analytics_component_id_fkey(
          activity_type,
          count
        )
      )
    `,
    )
    .limit(1000)

  if (error) {
    console.error(error)
    return <div>Error loading authors</div>
  }

  const authorsWithStats =
    authors
      ?.map((author) => {
        const totalDownloads =
          author.components?.reduce(
            (sum, comp) => sum + (comp.downloads_count || 0),
            0,
          ) ?? 0

        const totalUsages =
          author.components?.reduce((sum, comp) => {
            const analytics = comp.mv_component_analytics || []
            const promptCopyCount =
              analytics.find((a) => a.activity_type === "component_prompt_copy")
                ?.count ?? 0
            const codeCopyCount =
              analytics.find((a) => a.activity_type === "component_code_copy")
                ?.count ?? 0

            return sum + promptCopyCount + codeCopyCount
          }, 0) || 0

        const totalViews =
          author.components?.reduce((sum, comp) => {
            const analytics = comp.mv_component_analytics || []
            const viewCount =
              analytics.find((a) => a.activity_type === "component_view")
                ?.count ?? 0

            return sum + viewCount
          }, 0) || 0

        const totalEngagement = totalDownloads + totalUsages + totalViews

        return {
          ...author,
          total_downloads: totalDownloads,
          total_usages: totalUsages,
          total_views: totalViews,
          total_engagement: totalEngagement,
        }
      })
      .filter((a) => a.total_engagement > 0)
      .sort((a, b) => b.total_engagement - a.total_engagement) || []

  return (
    <>
      <Header text="Top authors" />
      <div className="container mx-auto mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {authorsWithStats.map((author) => (
            <Link
              href={`/${author.username}`}
              key={author.id}
              className="block p-6 rounded-lg border border-border/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                {author.image_url && (
                  <Image
                    src={author.image_url}
                    alt={author.name || author.username || ""}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div className="flex flex-col h-[140px] gap-2">
                  <div className="flex-1 min-h-0">
                    <h2 className="font-semibold text-lg">
                      {author.name || author.username}
                    </h2>
                    {author.bio && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {author.bio}
                      </p>
                    )}
                  </div>
                  <div className="text-sm flex flex-col text-gray-500 gap-1 mt-auto pt-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {author.total_views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {(
                        author.total_usages + author.total_downloads
                      ).toLocaleString()}{" "}
                      usages
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
