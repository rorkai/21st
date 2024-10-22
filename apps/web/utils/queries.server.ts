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
  const filterConditions = sourceDependencySlugs
    .map((slug) => {
      const [username, componentSlug] = slug.split("/")
      return `and(source_username.eq."${username}",source_component_slug.eq."${componentSlug}")`
    })
    .join(",")
  const { data: dependencies, error } = await supabase
    .from("component_dependencies_graph_view")
    .select("*")
    .or(filterConditions)
    .returns<
      (Partial<Tables<"components">> & {
        source_component_slug: string
        source_username: string
      })[]
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
      source_component_slug: component_slug,
      source_username: username,
      registry,
      dependencies: npmDependencies,
    } = dep

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
