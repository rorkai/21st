import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { uploadToR2 } from "@/lib/r2"
import { extractComponentNames } from "@/lib/parsers"
import { makeSlugFromName } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { data: user } = await supabaseWithAdminAccess
      .from("users")
      .select("username")
      .eq("id", userId)
      .single()

    if (!user?.username) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const data = await request.json()
    const baseFolder = `${userId}/${data.component_slug}`

    // Extract component names from code
    const componentNames = extractComponentNames(data.code)

    // Upload component files
    const [codeUrl, tailwindConfigUrl, globalCssUrl] = await Promise.all([
      uploadToR2({
        file: {
          name: "code.tsx",
          type: "text/plain",
          textContent: data.code,
        },
        fileKey: `${baseFolder}/code.tsx`,
        bucketName: "components-code",
      }),
      data.tailwind_config
        ? uploadToR2({
            file: {
              name: "tailwind.config.js",
              type: "text/plain",
              textContent: data.tailwind_config,
            },
            fileKey: `${baseFolder}/tailwind.config.js`,
            bucketName: "components-code",
          })
        : Promise.resolve(null),
      data.globals_css
        ? uploadToR2({
            file: {
              name: "globals.css",
              type: "text/plain",
              textContent: data.globals_css,
            },
            fileKey: `${baseFolder}/globals.css`,
            bucketName: "components-code",
          })
        : Promise.resolve(null),
    ])

    // Insert component data
    const { data: component, error: componentError } =
      await supabaseWithAdminAccess
        .from("components")
        .insert({
          name: data.name,
          component_slug: data.component_slug,
          registry: data.registry,
          description: data.description,
          website_url: data.website_url,
          license: data.license,
          is_public: data.is_public,
          user_id: userId,
          code: codeUrl,
          component_names: componentNames || [],
          global_css_extension: globalCssUrl,
          tailwind_config_extension: tailwindConfigUrl,
          preview_url: "",
          is_paid: false,
          price: 0,
          downloads_count: 0,
          likes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          direct_registry_dependencies: data.direct_registry_dependencies,
        })
        .select()
        .single()

    if (componentError) {
      console.error("Error inserting component:", componentError)
      return new NextResponse("Error inserting component", { status: 500 })
    }

    // Upload and save demos
    for (const demo of data.demos) {
      const demoFolder = `${baseFolder}/${demo.demo_slug}`

      // Upload demo files
      const [demoCodeUrl, previewImageR2Url, videoR2Url] = await Promise.all([
        uploadToR2({
          file: {
            name: "demo.tsx",
            type: "text/plain",
            textContent: demo.demo_code,
          },
          fileKey: `${demoFolder}/code.demo.tsx`,
          bucketName: "components-code",
        }),
        demo.preview_image_data_url
          ? uploadToR2({
              file: {
                name: "preview.png",
                type: "image/png",
                encodedContent: demo.preview_image_data_url.replace(
                  /^data:image\/(png|jpeg|jpg);base64,/,
                  "",
                ),
              },
              fileKey: `${demoFolder}/preview.png`,
              bucketName: "components-code",
              contentType: "image/png",
            })
          : Promise.resolve(null),
        demo.preview_video_data_url
          ? uploadToR2({
              file: {
                name: "video.mp4",
                type: "video/mp4",
                encodedContent: demo.preview_video_data_url.replace(
                  /^data:video\/mp4;base64,/,
                  "",
                ),
              },
              fileKey: `${demoFolder}/video.mp4`,
              bucketName: "components-code",
              contentType: "video/mp4",
            })
          : Promise.resolve(null),
      ])

      // Insert demo data
      const { data: demoData, error: demoError } = await supabaseWithAdminAccess
        .from("demos")
        .insert({
          component_id: component.id,
          name: demo.name,
          demo_slug: demo.demo_slug,
          demo_code: demoCodeUrl,
          preview_url: previewImageR2Url,
          video_url: videoR2Url,
          demo_dependencies: demo.demo_dependencies || {},
          demo_direct_registry_dependencies:
            demo.demo_direct_registry_dependencies || [],
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (demoError) {
        console.error("Error inserting demo:", demoError)
        return new NextResponse("Error inserting demo", { status: 500 })
      }

      // Add tags if they exist
      if (demo.tags && demo.tags.length > 0) {
        for (const tag of demo.tags) {
          let tagId: number

          if (tag.id) {
            tagId = tag.id
          } else {
            const capitalizedName =
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            const slug = makeSlugFromName(tag.name)

            // Check if tag exists
            const { data: existingTag } = await supabaseWithAdminAccess
              .from("tags")
              .select("id")
              .eq("slug", slug)
              .single()

            if (existingTag) {
              tagId = existingTag.id
            } else {
              // Create new tag
              const { data: newTag, error: insertError } =
                await supabaseWithAdminAccess
                  .from("tags")
                  .insert({ name: capitalizedName, slug })
                  .select()
                  .single()

              if (insertError) {
                console.error("Error inserting tag:", insertError)
                continue
              }

              if (newTag && typeof newTag === "object" && "id" in newTag) {
                tagId = newTag.id
              } else {
                console.error("New tag was not created or does not have an id")
                continue
              }
            }
          }

          // Link tag to demo
          const { error: linkError } = await supabaseWithAdminAccess
            .from("demo_tags")
            .insert({ demo_id: demoData.id, tag_id: tagId })

          if (linkError) {
            console.error("Error linking tag to demo:", linkError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      username: user.username,
      component_slug: data.component_slug,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
