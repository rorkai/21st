import { ErrorPage } from "@/components/ErrorPage"
import { UserProfileClient } from "./page.client"

import {
  getUserData,
  getUserComponents,
  getHuntedComponents,
} from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export const generateMetadata = async ({
  params,
}: {
  params: { username: string }
}) => {
  const { data: user } = await getUserData(
    supabaseWithAdminAccess,
    params.username,
  )

  if (!user) {
    return {
      title: "User Not Found",
    }
  }

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username}/opengraph-image`

  return {
    metadataBase: new URL("https://21st.dev"),
    title: `${user.name || user.username} | 21st.dev - The NPM for Design Engineers`,
    description: `Collection of free open source shadcn/ui React Tailwind components by ${user.name || user.username}.`,
    openGraph: {
      title: `${user.name || user.username}'s Components | 21st.dev - The NPM for Design Engineers`,
      description: `Browse ${user.name || user.username}'s collection of React Tailwind components inspired by shadcn/ui.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${user.name || user.username}'s profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name || user.username}'s Components | 21st.dev - The NPM for Design Engineers`,
      description: `Browse ${user.name || user.username}'s collection of React Tailwind components inspired by shadcn/ui.`,
      images: [ogImageUrl],
    },
    keywords: [
      "react components",
      "tailwind css",
      "ui components",
      "shadcn/ui",
      "shadcn",
      "open source",
      `${user.username} components`,
    ],
  }
}

export default async function UserProfile({
  params,
}: {
  params: { username: string }
}) {
  const { data: user, error } = await getUserData(
    supabaseWithAdminAccess,
    params.username,
  )

  if (!user || !user.username) {
    return (
      <ErrorPage error={new Error(`Error fetching user: ${error?.message}`)} />
    )
  }

  const publishedComponents = await getUserComponents(
    supabaseWithAdminAccess,
    user.id,
  )
  const huntedComponents = await getHuntedComponents(
    supabaseWithAdminAccess,
    user.username,
  )

  return (
    <UserProfileClient
      user={user}
      publishedComponents={publishedComponents || []}
      huntedComponents={huntedComponents || []}
    />
  )
}
