/* eslint-disable @next/next/no-img-element */
import React from "react"
import { ComponentsList } from "@/components/ComponentsList"
import { Header } from "@/components/Header"
import { getUserData, getUserComponents } from "@/lib/queries"
import { UserAvatar } from "@/components/UserAvatar"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import ErrorPage from "@/components/ErrorPage"

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
      <div className="flex mx-auto px-4 py-8 mt-20">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex md:w-[30%] md:min-w-[300px] flex-col items-center w-full ">
            <div className="flex flex-col items-center md:items-start">
              <UserAvatar
                src={user.image_url || "/placeholder.svg"}
                alt={user.name}
                size={184}
                className="cursor-default"
              />
              <h1 className="mt-4 text-[44px] leading-1 font-bold">
                {user.name}
              </h1>
              <p className="text-[20px] leading-none text-muted-foreground">
                @{user.username}
              </p>
              {user.manually_added === true && (
                <div className="flex flex-col mt-7 -mx-4">
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
          <div className="w-full md:w-[70%]">
            <ComponentsList components={components} />
          </div>
        </div>
      </div>
    </>
  )
}
