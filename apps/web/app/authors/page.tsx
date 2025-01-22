import Link from "next/link"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Header } from "@/components/ui/header.client"
import { Download, Eye } from "lucide-react"
import { Metadata } from "next"
import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
      display_username,
      display_name,
      display_image_url,
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
      <div className="container mx-auto mt-20 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {authorsWithStats.map((author) => (
            <Link
              href={`/${author.display_username || author.username}`}
              key={author.id}
            >
              <Card className="h-full hover:bg-accent/50 transition-colors">
                <CardHeader className="h-full">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 bg-muted/30">
                      {author.display_image_url || author.image_url ? (
                        <AvatarImage
                          src={
                            author.display_image_url || author.image_url || ""
                          }
                          alt={
                            author.display_name ||
                            author.name ||
                            author.username ||
                            ""
                          }
                        />
                      ) : (
                        <AvatarFallback>
                          {(
                            (author.display_name ||
                              author.name ||
                              author.username ||
                              "?")?.[0] || "?"
                          ).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col h-full">
                      <div className="space-y-1 mb-4">
                        <h2 className="font-semibold text-lg">
                          {author.display_name ||
                            author.name ||
                            author.username}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-1 h-5">
                          {author.bio ||
                            `@${author.display_username || author.username}`}
                        </p>
                      </div>
                      <div className="mt-auto space-y-0.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">
                            {author.total_views.toLocaleString()} views
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Download className="w-4 h-4" />
                          <span className="text-sm">
                            {(
                              author.total_usages + author.total_downloads
                            ).toLocaleString()}{" "}
                            usages
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
