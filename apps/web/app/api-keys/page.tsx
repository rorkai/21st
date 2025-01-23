import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ApiKeysList } from "@/components/features/api/api-keys-list"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { ApiKey } from "@/types/global"

export default async function ApiKeysPage() {
  const { userId } = auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const supabase = supabaseWithAdminAccess

  const { data: rawApiKeys } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Transform raw data to match ApiKey type
  const apiKeys: ApiKey[] = (rawApiKeys || []).map((key) => ({
    id: key.id,
    key: key.key,
    user_id: key.user_id,
    plan: key.plan || "free",
    requests_limit: key.requests_limit || 100,
    requests_count: key.requests_count || 0,
    created_at: key.created_at || new Date().toISOString(),
    expires_at: key.expires_at,
    last_used_at: key.last_used_at,
    is_active: key.is_active || true,
  }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your API keys and access levels
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Available Plans</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <h3 className="font-semibold">Free</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                100 requests/month
              </p>
              <p className="mt-4 text-sm">
                Perfect for testing and small projects
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <h3 className="font-semibold">Pro</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                10 000 requests/month
              </p>
              <p className="mt-4 text-sm">
                Message Serafim on{" "}
                <a
                  href="https://discord.gg/Qx4rFunHfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Discord
                </a>{" "}
                to get access
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <h3 className="font-semibold">Enterprise</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Custom solutions
              </p>
              <p className="mt-4 text-sm">
                Message Serafim on{" "}
                <a
                  href="https://discord.gg/Qx4rFunHfm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Discord
                </a>{" "}
                to get access
              </p>
            </div>
          </div>
        </div>

        <ApiKeysList initialKeys={apiKeys} userId={userId} />
      </div>
    </div>
  )
}
