import { Database, Tables } from "@/types/supabase"
import { SupabaseClient } from "@supabase/supabase-js"

export async function resolveRegistryDependencyTree({
  supabase,
  sourceDependencySlugs,
}: {
  supabase: SupabaseClient<Database>
  sourceDependencySlugs: string[]
}): Promise<
  | { data: Record<string, { code: string; registry: string }>; error: null }
  | { data: null; error: Error }
> {
  const { data: dependencies, error } = await supabase
    .from("component_dependencies_closure")
    .select(
      `
      component_id!inner(user_id(username), component_slug),
      dependency_component_id,
      components:dependency_component_id (
        component_slug,
        registry,
        code,
        user:user_id (username)
      )
    `,
    )
    .in(
      "component_id.component_slug",
      sourceDependencySlugs.map((slug) => slug.split("/")[1]),
    )
    .returns<
      {
        components: Partial<Tables<"components">> & {
          user: { username: string }
        }
      }[]
    >()

  if (error)
    return {
      data: null,
      error: new Error(
        `Failed to fetch registry dependency tree: ${error.message}`,
      ),
    }

  const r2FetchPromises = dependencies.map(async (dep) => {
    const {
      code: r2Link,
      component_slug,
      user: { username },
      registry,
    } = dep.components

    const response = await fetch(r2Link!)
    if (!response.ok) {
      console.error(
        `Error downloading file for ${username}/${component_slug}:`,
        response.statusText,
        r2Link,
      )
      return {
        data: null,
        error: new Error(
          `Error downloading file for ${username}/${component_slug}: ${response.statusText}`,
        ),
      }
    }

    const code = await response.text()
    if (!code) {
      console.error(
        `Error loading dependency ${username}/${component_slug}: No code returned`,
      )
      return {
        data: null,
        error: new Error(
          `Error loading dependency ${username}/${component_slug}: no code returned`,
        ),
      }
    }

    const filePath = `/components/${registry}/${component_slug}.tsx`
    return { data: { [filePath]: { code, registry } }, error: null }
  })

  const fileResults = await Promise.all(r2FetchPromises)
  if (fileResults.some((result) => result.error)) {
    return {
      data: null,
      error: new Error(
        `Error loading registry dependencies: ${fileResults.find((result) => result.error)?.error?.message.toLowerCase()}`,
      ),
    }
  }

  return {
    data: fileResults
      .filter((result) => result?.data && typeof result.data === "object")
      .reduce(
        (acc, r) => ({
          ...acc,
          ...(r.data as Record<string, { code: string; registry: string }>),
        }),
        {},
      ),
    error: null,
  }
}
