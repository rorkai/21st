import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { SupabaseClient } from "@supabase/supabase-js"

import { Header } from "@/components/Header"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { TagPageContent } from "./page.client"
import {
  Component,
  QuickFilterOption,
  SortOption,
  DemoWithComponent,
  User,
} from "@/types/global"
import { cookies } from "next/headers"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"
import { transformDemoResult } from "@/lib/utils/transformData"

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
    throw error
  }

  return data
}

export default async function TagPage({ params }: TagPageProps) {
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const cookieStore = cookies()
  const tagSlug = params.tag_slug

  try {
    const tagInfo = await getTagInfo(supabaseWithAdminAccess, tagSlug)
    if (!tagInfo) {
      redirect("/")
    }

    const hasOnboarded = cookieStore.has("has_onboarded")
    const savedSortBy = cookieStore.get("saved_sort_by")?.value as
      | SortOption
      | undefined
    const savedQuickFilter = cookieStore.get("saved_quick_filter")?.value as
      | QuickFilterOption
      | undefined

    const defaultQuickFilter = hasOnboarded ? "last_released" : "all"
    const defaultSortBy: SortOption = hasOnboarded ? "date" : "downloads"

    const sortByPreference: SortOption = savedSortBy?.length
      ? (savedSortBy as SortOption)
      : defaultSortBy
    const quickFilterPreference: QuickFilterOption = savedQuickFilter?.length
      ? (savedQuickFilter as QuickFilterOption)
      : defaultQuickFilter

    const filteredDemos = await supabaseWithAdminAccess.rpc(
      "get_filtered_demos",
      {
        p_quick_filter: quickFilterPreference,
        p_sort_by: sortByPreference,
        p_offset: 0,
        p_limit: 40,
        p_tag_slug: tagSlug,
      },
    )

    if (filteredDemos.error) {
      redirect("/")
    }

    const initialFilteredSortedDemos = (filteredDemos.data || []).map(
      transformDemoResult,
    )

    const { data: initialTabsCountsData, error: initialTabsCountsError } =
      await supabaseWithAdminAccess.rpc("get_components_counts", {
        p_tag_slug: tagSlug,
      })

    const initialTabsCounts =
      !initialTabsCountsError && Array.isArray(initialTabsCountsData)
        ? initialTabsCountsData.reduce(
            (acc, item) => {
              acc[item.filter_type as QuickFilterOption] = item.count
              return acc
            },
            {} as Record<QuickFilterOption, number>,
          )
        : {
            all: 0,
            last_released: 0,
            most_downloaded: 0,
          }

    return (
      <>
        {tagInfo && <Header text={tagInfo?.name} />}
        <TagPageContent
          initialComponents={initialFilteredSortedDemos}
          tagName={tagInfo.name}
          tagSlug={tagSlug}
          initialTabCounts={initialTabsCounts}
          initialSortBy={sortByPreference}
          initialQuickFilter={quickFilterPreference}
        />
      </>
    )
  } catch (error) {
    console.error("Error in tag page:", error)
    redirect("/")
  }
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  try {
    const tagInfo = await getTagInfo(supabaseWithAdminAccess, params.tag_slug)
    if (!tagInfo) {
      redirect("/")
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${tagInfo.name} Components | 21st.dev - The NPM for Design Engineers`,
      description: `Ready-to-use ${tagInfo.name.toLowerCase()} React components inspired by shadcn/ui.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/s/${params.tag_slug}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: `${tagInfo.name} React components`,
      },
    }

    return {
      title: `${tagInfo.name} Components | 21st.dev - The NPM for Design Engineers`,
      description: `Discover and share ${tagInfo.name.toLowerCase()} components. Ready-to-use React Tailwind components inspired by shadcn/ui.`,
      openGraph: {
        title: `${tagInfo.name} Components | 21st.dev - The NPM for Design Engineers`,
        description: `Ready-to-use ${tagInfo.name.toLowerCase()} React Tailwind components inspired by shadcn/ui.`,
      },
      keywords: [
        `${tagInfo.name.toLowerCase()} components`,
        "react components",
        "design engineers",
        "component library",
        "tailwind components",
        "ui components",
        `${tagInfo.name.toLowerCase()} shadcn/ui`,
      ],
      other: {
        "script:ld+json": JSON.stringify(jsonLd),
      },
    }
  } catch (error) {
    redirect("/")
  }
}
