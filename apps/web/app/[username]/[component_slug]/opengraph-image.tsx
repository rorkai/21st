/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og"
import { getComponent, getUserData } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export const runtime = "edge"
export const alt = "Open Graph Image"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: { username: string; component_slug: string }
}) {
  const { username, component_slug } = params
  console.log(username, component_slug)

  const [componentResult, userResult] = await Promise.all([
    getComponent(supabaseWithAdminAccess, username, component_slug),
    getUserData(supabaseWithAdminAccess, username),
  ])
  const component = componentResult.data
  const user = userResult.data

  if (!component || !user) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            fontSize: "32px",
            color: "#000",
          }}
        >
          Component or User not found
        </div>
      ),
      {
        ...size,
      },
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            bottom: "20px",
            width: "60%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={component.preview_url}
            alt={`Preview of ${component.name}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "80px",
            width: "200px",
            height: "200px",
            borderRadius: "100%",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={user.image_url || "https://21st.dev/placeholder.svg"}
            alt={`${user.username}'s avatar`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: "3px solid rgba(0, 0, 0, 0.3)",
              pointerEvents: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "80px",
            right: "80px",
            display: "flex",
            color: "#0A0A0A",
            flexDirection: "column",
            alignItems: "flex-start",
            fontSize: "50px",
            fontWeight: "bold",
            padding: "10px",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              color: "#A3A3A3",
              textOverflow: "ellipsis",
            }}
          >
            @{user.username}
          </span>

          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {component.name}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
