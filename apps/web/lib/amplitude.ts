import * as amplitude from "@amplitude/analytics-browser"
import { sessionReplayPlugin } from "@amplitude/plugin-session-replay-browser"

export const initAmplitude = () => {
  if (typeof window !== "undefined") {
    if (process.env.NODE_ENV === "production") {
      const sessionReplayTracking = sessionReplayPlugin({
        sampleRate: 0.0001,
      })
      amplitude.add(sessionReplayTracking)
    }

    amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "", {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: true,
        fileDownloads: true,
      },
    })
  }
}

export const trackPageProperties = (properties: Record<string, any>) => {
  amplitude.track("", { ...properties })
}

export const AMPLITUDE_EVENTS = {
  COPY_INSTALL_COMMAND: "component_install_command_copied",
  COPY_CODE: "component_code_copied",
  COPY_DEPENDENCY: "component_dependency_copied",
  COPY_ALL_DEPENDENCIES: "component_all_dependencies_copied",
  LIKE_COMPONENT: "component_liked",
  UNLIKE_COMPONENT: "component_unliked",
  SHARE_COMPONENT: "component_shared",
  SORT_COMPONENTS: "components_list_sorted",
  VIEW_ON_NPM: "npm_package_viewed",
  PUBLISH_COMPONENT: "component_published",
  TOGGLE_CODE_VIEW: "code_view_toggled",
  EDIT_COMPONENT: "component_edit_started",
  VIEW_USER_PROFILE: "user_profile_viewed",
  VIEW_SIDEBAR_SECTION: "sidebar_section_viewed",
  SEARCH_COMPONENTS: "components_searched",
  COPY_AI_PROMPT: "ai_prompt_copied",
} as const

export const trackEvent = (
  eventName: (typeof AMPLITUDE_EVENTS)[keyof typeof AMPLITUDE_EVENTS],
  eventProperties?: Record<string, any>,
) => {
  amplitude.track(eventName, eventProperties)
}

export const identifyUser = (
  userId: string | null | undefined,
  userProperties?: Record<string, any>,
) => {
  if (userId) {
    amplitude.setUserId(userId)
    if (userProperties) {
      const identify = new amplitude.Identify()
      Object.entries(userProperties).forEach(([key, value]) => {
        identify.set(key, value)
      })
      amplitude.identify(identify)
    }
  } else {
    amplitude.setUserId(undefined)
  }
}
