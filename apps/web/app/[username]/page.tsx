/* eslint-disable @next/next/no-img-element */
import React from "react"
import { ComponentsList } from "@/components/ComponentsList"
import { Header } from "@/components/Header"
import { getUserData, getUserComponents } from "@/lib/queries"
import { UserAvatar } from "@/components/UserAvatar"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import ErrorPage from "@/components/ErrorPage"
import { UserProfileAnalytics } from "@/components/UserProfileAnalytics"
import Link from "next/link"
import { Icons } from "@/components/icons"

export const generateMetadata = async ({
  params,
}: {
  params: { username: string }
}) => {
  const { data: user } = await getUserData(
    supabaseWithAdminAccess,
    params.username,
  )
  return {
    title: user
      ? `${user.name}'s Profile | Component Library`
      : "User Not Found",
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

  if (!user) {
    return (
      <ErrorPage error={new Error(`Error fetching user: ${error?.message}`)} />
    )
  }

  const components = await getUserComponents(supabaseWithAdminAccess, user.id)

  return (
    <>
      <Header page="profile" />
      <UserProfileAnalytics 
        username={user.username}
        isManuallyAdded={user.manually_added}
      />
      <div className="flex mx-auto px-2 sm:px-4 md:px-16 py-8 mt-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-16 w-full">
          <div className="flex md:w-[20%] md:min-w-[300px] flex-col items-center w-full">
            <div className="flex flex-col items-center md:items-start space-y-6">
              <UserAvatar
                src={user.image_url || "/placeholder.svg"}
                alt={user.name}
                size={120}
                className="cursor-default"
              />
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {user.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  @{user.username}
                </p>
                {user.bio && (
                  <p className="text-sm text-muted-foreground max-w-md leading-normal">
                    {user.bio}
                  </p>
                )}
                <div className="flex items-center gap-4 pt-2">
                  {user.twitter_url && (
                    <Link
                      href={user.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Twitter Profile"
                    >
                      <Icons.twitter className="h-5 w-5" />
                    </Link>
                  )}
                  <Link
                    href={user.manually_added ? user.github_url || `https://github.com/${user.username}` : `https://github.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="GitHub Profile"
                  >
                    <Icons.gitHub className="h-5 w-5" />
                  </Link>
                </div>
              </div>
              {user.manually_added === true && (
                <div className="flex flex-col w-full">
                  <Alert>
                    <AlertTitle>
                      This profile was created by 21st.dev
                    </AlertTitle>
                    <AlertDescription>
                      To claim this profile, please contact{" "}
                      <a
                        href="https://x.com/serafimcloud"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        @serafimcloud
                      </a>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
          <div className="w-full md:w-[80%]">
            <ComponentsList components={components} />
          </div>
        </div>
      </div>
    </>
  )
}
