import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { load } from "cheerio"

import { Header } from "@/components/Header"
import { UserAvatar } from "@/components/UserAvatar"

import { supabaseWithAdminAccess } from "@/lib/supabase"

async function getOGImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const html = await response.text()
    const $ = load(html)

    const ogImage =
      $('meta[property="og:image"]').first().attr("content") ||
      $('meta[property="og:image:secure_url"]').first().attr("content") ||
      $('meta[name="og:image"]').first().attr("content") ||
      $('meta[name="twitter:image"]').first().attr("content") ||
      $('meta[property="twitter:image"]').first().attr("content")

    if (!ogImage) {
      console.log("No OG image found for", url)
      $("meta").each((i, elem) => {
        console.log($(elem).attr("property"), $(elem).attr("content"))
      })
    }

    return ogImage || null
  } catch (error) {
    console.error(`Error fetching OG image for ${url}:`, error)
    return null
  }
}

export const dynamic = "force-dynamic"

export const generateMetadata = async (): Promise<Metadata> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pro | 21st.dev | The NPM for Design Engineers",
    description: "Discover premium React components from trusted developers",
    url: `${baseUrl}/pro`,
  }

  return {
    title: "Pro | 21st.dev | The NPM for Design Engineers",
    description: "Premium React components from trusted developers",
    keywords: [
      "premium react components",
      "pro components",
      "tailwind css",
      "ui components",
      "design engineers",
      "component library",
      "shadcn ui",
    ],
    openGraph: {
      title: "Pro | 21st.dev | The NPM for Design Engineers",
      description: "Premium React components from trusted developers",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Pro | 21st.dev | The NPM for Design Engineers",
      description: "Premium React components from trusted developers",
      images: [`${baseUrl}/og-image.png`],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  }
}

export default async function ProPage() {
  const { data: publishers } = await supabaseWithAdminAccess
    .from("users")
    .select("*")
    .not("pro_referral_url", "is", null)
    .not("pro_referral_url", "eq", "")
    .order("created_at", { ascending: true })

  const publishersWithImages = await Promise.all(
    publishers?.map(async (publisher) => {
      if (!publisher.pro_banner_url) {
        const ogImage = publisher.pro_referral_url
          ? await getOGImage(publisher.pro_referral_url)
          : null

        return {
          ...publisher,
          image: ogImage,
        }
      }

      return {
        ...publisher,
        image: publisher.pro_banner_url,
      }
    }) || [],
  )

  return (
    <>
      <Header page="pro" />

      <div className="container mx-auto mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {publishersWithImages.map((publisher) => (
            <div className="flex flex-col group" key={publisher.id}>
              <Link
                href={publisher.pro_referral_url!!}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer"
              >
                <div className="relative aspect-[16/9] mb-3 group">
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div className="relative w-full h-full">
                      <div
                        className="absolute inset-0"
                        style={{ margin: "-1px" }}
                      >
                        {publisher.image ? (
                          <Image
                            src={publisher.image}
                            alt={`${publisher.name || publisher.username}'s Pro Components`}
                            fill
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">
                              No preview available
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 to-foreground/5" />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex items-center space-x-3">
                <UserAvatar
                  src={publisher.image_url || "/placeholder.svg"}
                  alt={publisher.name}
                  size={24}
                  user={publisher}
                  isClickable
                />
                <div className="flex items-center justify-between flex-grow min-w-0">
                  <Link
                    href={publisher.pro_referral_url || "#"}
                    className="block cursor-pointer min-w-0 flex-1 mr-3"
                  >
                    <h2 className="text-sm font-medium text-foreground truncate">
                      {publisher.name || publisher.username}
                    </h2>
                  </Link>
                  <Link
                    target="_blank"
                    href={publisher.pro_referral_url!!}
                    className="text-xs text-muted-foreground whitespace-nowrap shrink-0 group/arrow"
                  >
                    Open{" "}
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-[2px]">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
