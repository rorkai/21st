"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TermsDialog } from "./terms-dialog"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { ApiKey } from "@/types/global"
import { toast } from "sonner"

interface ApiKeysListProps {
  initialKeys: ApiKey[]
  userId: string
}

export function ApiKeysList({ initialKeys, userId }: ApiKeysListProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [showTerms, setShowTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useClerkSupabaseClient()


  const createApiKey = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("create_api_key", {
        user_id: userId,
        plan: "free",
        requests_limit: 100,
      })

      if (error) throw error

      // Transform the data to match ApiKey type
      const newKey: ApiKey = {
        id: data.id,
        key: data.key,
        user_id: data.user_id,
        plan: data.plan || "free",
        requests_limit: data.requests_limit || 100,
        requests_count: data.requests_count || 0,
        created_at: data.created_at || new Date().toISOString(),
        expires_at: data.expires_at,
        last_used_at: data.last_used_at,
        is_active: data.is_active || true,
      }

      setKeys([newKey, ...keys])
      toast.success("API key created successfully")
    } catch (error) {
      console.error("Error creating API key:", error)
      toast.error("Failed to create API key")
    } finally {
      setLoading(false)
      setShowTerms(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", keyId)

      if (error) throw error

      setKeys(keys.filter((k) => k.id !== keyId))
      toast.success("API key deleted successfully")
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast.error("Failed to delete API key")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your API Keys</h2>
        <Button onClick={() => setShowTerms(true)} disabled={loading}>
          Create New Key
        </Button>
      </div>

      <div className="mt-4">
        {keys.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            You haven't created any API keys yet.
          </p>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-sm break-all">{key.key}</div>
                    <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Requests: {key.requests_count} / {key.requests_limit}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => deleteApiKey(key.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TermsDialog
        open={showTerms}
        onAccept={createApiKey}
        onClose={() => setShowTerms(false)}
      />
    </div>
  )
}
