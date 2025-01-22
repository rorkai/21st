import { ImageResponse } from "next/og"
import { getComponentWithDemoForOG } from "@/lib/queries"
import { supabaseWithAdminAccess } from "@/lib/supabase"

export const runtime = "edge"
export const alt = "Component Demo"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: { username: string; component_slug: string; demo_slug: string }
}) {
  const { username, component_slug, demo_slug } = params

  const result = await getComponentWithDemoForOG(
    supabaseWithAdminAccess,
    username,
    component_slug,
    demo_slug,
  )

  if (!result.data) {
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
          Component or Demo not found
        </div>
      ),
      {
        ...size,
      },
    )
  }

  const { component, demo } = result.data
  const analytics = (component as any).mv_component_analytics || []
  const viewCount =
    analytics.find(
      (a: { activity_type: string }) => a.activity_type === "component_view",
    )?.count ?? 0
  const promptCopyCount =
    analytics.find(
      (a: { activity_type: string }) =>
        a.activity_type === "component_prompt_copy",
    )?.count ?? 0
  const codeCopyCount =
    analytics.find(
      (a: { activity_type: string }) =>
        a.activity_type === "component_code_copy",
    )?.count ?? 0
  const totalUsages =
    (component.downloads_count || 0) + promptCopyCount + codeCopyCount

  return new ImageResponse(
    (
      <div
        style={{
          background: "hsl(0 0% 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "80px",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Preview in top right */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "400px",
              height: "300px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "hsl(0 0% 97%)",
              borderRadius: "12px",
            }}
          >
            <img
              src={demo.preview_url || component.preview_url}
              alt={`Preview of ${demo.name || component.name}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Name and description at top left */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              paddingRight: "440px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  fontSize: "56px",
                  fontWeight: "bold",
                  color: "hsl(240 10% 3.9%)",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                <div style={{ display: "flex" }}>
                  {component.name} / {(demo as any).name}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <img
                    src={
                      component.user.display_image_url ||
                      component.user.image_url ||
                      "https://21st.dev/placeholder.svg"
                    }
                    alt={
                      component.user.display_name || component.user.name || ""
                    }
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "32px",
                    color: "hsl(240 3.8% 46.1%)",
                  }}
                >
                  {component.user.display_name || component.user.name}
                </div>
              </div>
            </div>
            {component.description && (
              <div
                style={{
                  display: "flex",
                  fontSize: "28px",
                  color: "hsl(240 3.8% 46.1%)",
                  WebkitLineClamp: 4,
                  overflow: "hidden",
                  lineHeight: "1.4",
                  maxWidth: "700px",
                }}
              >
                {component.description}
              </div>
            )}
          </div>

          {/* Stats at bottom */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "40px",
                fontSize: "32px",
                color: "hsl(240 3.8% 46.1%)",
              }}
            >
              <div style={{ display: "flex" }}>
                {viewCount.toLocaleString()} views
              </div>
              <div style={{ display: "flex" }}>
                {totalUsages.toLocaleString()} usages
              </div>
              <div style={{ display: "flex" }}>
                {(component.likes_count || 0).toLocaleString()} likes
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "hsl(240 10% 3.9%)",
                }}
              />
              <div
                style={{
                  fontSize: "32px",
                  color: "hsl(240 10% 3.9%)",
                  fontWeight: "500",
                }}
              >
                21st.dev
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
