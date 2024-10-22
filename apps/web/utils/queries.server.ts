import { Database, Tables } from "@/types/supabase"
import { SupabaseClient } from "@supabase/supabase-js"

export async function resolveRegistryDependencyTree({
  supabase,
  sourceDependencySlugs,
}: {
  supabase: SupabaseClient<Database>
  sourceDependencySlugs: string[]
}): Promise<
  | {
      data: {
        filesWithRegistry: Record<string, { code: string; registry: string }>
        npmDependencies: Record<string, string>
      }
      error: null
    }
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
        dependencies,
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
          dependencies: string
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
      dependencies: npmDependencies,
    } = dep.components

    const response = await fetch(r2Link!)
    if (!response.ok) {
      console.error(
        `Error downloading file for ${username}/${component_slug}:`,
        response.statusText,
        r2Link,
      )
      return {
        error: new Error(
          `Error downloading file for ${username}/${component_slug}: ${response.statusText}`,
        ),
        npmDependencies: npmDependencies,
        fileWithRegistry: null,
      }
    }

    const code = await response.text()
    if (!code) {
      console.error(
        `Error loading dependency ${username}/${component_slug}: No code returned`,
      )
      return {
        error: new Error(
          `Error loading dependency ${username}/${component_slug}: no code returned`,
        ),
        npmDependencies: npmDependencies,
        fileWithRegistry: null,
      }
    }

    const filePath = `/components/${registry}/${component_slug}.tsx`
    return {
      error: null,
      npmDependencies: npmDependencies,
      fileWithRegistry: { [filePath]: { code, registry: registry! } },
    }
  })

  const results = await Promise.all(r2FetchPromises)

  const errors = results.filter((result) => result.error)
  if (errors.length > 0) {
    return {
      data: null,
      error: new Error(
        `Error loading registry dependencies: ${errors[0]?.error?.message.toLowerCase()}`,
      ),
    }
  }

  const npmDependencies = Object.assign({}, ...results.map(r => r.npmDependencies))
  const filesWithRegistry = Object.assign({}, ...results.map(r => r.fileWithRegistry).filter(Boolean))

  return {
    data: {
      filesWithRegistry,
      npmDependencies,
    },
    error: null,
  }
}
