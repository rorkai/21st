import { supabaseWithAdminAccess } from "@/utils/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { component_slug: string } },
) {
  const component_slug = params.component_slug

  try {
    const { data: component, error } = await supabaseWithAdminAccess
      .from("components")
      .select("*")
      .eq("component_slug", component_slug)
      .single()

    if (error) throw error

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      )
    }

    const codePath = `${component_slug}-code.tsx`

    const { data: codeContent, error: codeError } =
      await supabaseWithAdminAccess
        .storage
        .from("components")
        .download(codePath)

    if (codeError) throw codeError

    const code = await codeContent.text()

    const responseData = {
      name: component_slug,
      type: "registry:ui",
      files: [
        {
          path: `cc/${component_slug}.tsx`,
          content: code,
          type: "registry:ui",
          target: "",
        },
      ],
    }

    return NextResponse.json(responseData)
  } catch (error: unknown) {
    console.error("Unexpected error:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
