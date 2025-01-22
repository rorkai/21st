"use client"

import Link from "next/link"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/header.client"
import { Icons } from "@/components/icons"
import { UserAvatar } from "@/components/ui/user-avatar"
import { UserComponentsHeader } from "@/components/features/user-page/user-page-header"
import { UserComponentsList } from "@/components/features/user-page/user-page-items-list"
import { appendQueryParam } from "@/lib/utils"
import { Globe, SquareArrowOutUpRight } from "lucide-react"
import { trackEvent } from "@/lib/amplitude"
import { useEffect } from "react"
import { AMPLITUDE_EVENTS } from "@/lib/amplitude"
import {
  Component,
  DemoWithComponent,
  User,
  HuntedComponents,
} from "@/types/global"

const useProfileAnalytics = ({
  username,
  isManuallyAdded,
}: {
  username: string | null
  isManuallyAdded: boolean
}) => {
  useEffect(() => {
    trackEvent(AMPLITUDE_EVENTS.VIEW_USER_PROFILE, {
      username,
      isManuallyAdded,
    })
  }, [username, isManuallyAdded])
}

export function UserProfileClient({
  user,
  publishedComponents,
  huntedComponents,
  userDemos,
}: {
  user: User
  publishedComponents: DemoWithComponent[]
  huntedComponents: HuntedComponents
  userDemos: DemoWithComponent[]
}) {
  useProfileAnalytics({
    username: user.display_username || user.username || "",
    isManuallyAdded: user.manually_added,
  })

  return (
    <div key={user.id}>
      <Header />
      <div className="flex mx-auto px-2 sm:px-4 md:px-16 py-8 mt-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-16 w-full">
          <div className="flex md:w-[20%] md:min-w-[300px] flex-col items-center w-full">
            <div className="flex flex-col items-center md:items-start space-y-6">
              <UserAvatar
                src={
                  user.display_image_url || user.image_url || "/placeholder.svg"
                }
                alt={user.display_name || user.name || ""}
                size={120}
                className="cursor-default"
              />
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {user.display_name || user.name || ""}
                </h1>
                <p className="text-lg text-muted-foreground">
                  @{user.display_username || user.username || ""}
                </p>
                {user.bio && (
                  <p className="text-sm text-muted-foreground max-w-md leading-normal">
                    {user.bio}
                  </p>
                )}
                <div className="flex items-center md:justify-start justify-center gap-4 pt-2">
                  {user.twitter_url && (
                    <Link
                      href={user.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Twitter Profile"
                    >
                      <Icons.twitter className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    href={
                      user.manually_added
                        ? user.github_url ||
                          `https://github.com/${user.display_username || user.username || ""}`
                        : `https://github.com/${user.display_username || user.username || ""}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="GitHub Profile"
                  >
                    <Icons.gitHub className="h-54 w-5" />
                  </Link>
                  {user.website_url && !user.pro_referral_url && (
                    <Link
                      href={appendQueryParam(
                        user.website_url,
                        "ref",
                        "21st.dev",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Website"
                    >
                      <Globe className="h-5 w-5" />
                    </Link>
                  )}
                  {user.pro_referral_url && (
                    <Link
                      href={user.pro_referral_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        className="h-8 py-0 pe-0 bg-primary text-primary-foreground hover:bg-primary/90"
                        variant="default"
                      >
                        <span className="mr-2">Pro components</span>
                        <span className="relative ms-2 inline-flex h-full items-center justify-center px-3 before:absolute before:inset-0 before:left-0 before:w-px before:bg-primary-foreground/30">
                          <SquareArrowOutUpRight
                            size={16}
                            strokeWidth={2}
                            className="text-primary-foreground"
                            aria-hidden="true"
                          />
                        </span>
                      </Button>
                    </Link>
                  )}
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
            <UserComponentsHeader
              publishedComponents={publishedComponents}
              huntedComponents={huntedComponents}
              userDemos={userDemos}
              username={user.display_username || user.username || ""}
            />
            <UserComponentsList
              user={user}
              publishedComponents={publishedComponents}
              huntedComponents={huntedComponents}
              userDemos={userDemos}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
