"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { ApiKey } from "@/types/global"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Trash2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Code } from "@/components/ui/code"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ApiKeyManagerProps {
  initialKey: ApiKey | null
  userId: string
}

export function ApiKeyManager({ initialKey, userId }: ApiKeyManagerProps) {
  const [key, setKey] = useState<ApiKey | null>(initialKey)
  const [showTerms, setShowTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projectUrl, setProjectUrl] = useState("")
  const supabase = useClerkSupabaseClient()

  const createApiKey = async () => {
    if (!projectUrl) {
      toast.error("Please enter your project URL")
      return
    }

    try {
      const urlObj = new URL(projectUrl)
      if (!urlObj.hostname) {
        toast.error("Please enter a valid URL")
        return
      }
    } catch (e) {
      toast.error("Please enter a valid URL")
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("create_api_key", {
        user_id: userId,
        plan: "free",
        requests_limit: 100
      })

      if (error) throw error

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
        is_active: data.is_active ?? true,
        project_url: data.project_url || projectUrl,
      }

      setKey(newKey)
      toast.success("API key created successfully")
    } catch (error) {
      console.error("Error creating API key:", error)
      toast.error("Failed to create API key")
    } finally {
      setLoading(false)
      setShowTerms(false)
    }
  }

  const deleteApiKey = async () => {
    if (!key) return

    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", key.id)

      if (error) throw error

      setKey(null)
      toast.success("API key deleted successfully")
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast.error("Failed to delete API key")
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Your API Key
            </div>
          </CardTitle>
          {!key && (
            <Button onClick={() => setShowTerms(true)} disabled={loading}>
              Create API Key
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          {!key ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You haven't created an API key yet. Create one to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 p-4 rounded-lg border bg-card text-card-foreground">
              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-3 flex-1">
                  <Code
                    code={key.key}
                    language="bash"
                    fontSize="sm"
                    display="block"
                    className="m-0"
                  />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <time dateTime={key.created_at} className="tabular-nums">
                      Created {formatDate(key.created_at)}
                    </time>
                    {key.last_used_at && (
                      <time
                        dateTime={key.last_used_at}
                        className="tabular-nums"
                      >
                        Last used {formatDate(key.last_used_at)}
                      </time>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Project URL:{" "}
                    <a
                      href={key.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {key.project_url}
                    </a>
                  </div>
                </div>
                <Button variant="ghost" className="h-9" onClick={deleteApiKey}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete API key</span>
                </Button>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between text-sm">
                  <span>Usage</span>
                  <span className="tabular-nums">
                    {key.requests_count} / {key.requests_limit} requests
                  </span>
                </div>
                <Progress
                  value={(key.requests_count / key.requests_limit) * 100}
                  className={cn(
                    key.requests_count / key.requests_limit >= 0.8
                      ? "bg-destructive/20"
                      : "",
                    "[&>div]:bg-destructive",
                  )}
                />
                {key.requests_count / key.requests_limit >= 0.8 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You are approaching your API request limit. Consider
                      upgrading your plan.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              By creating an API key, you agree to our terms of service and
              acceptable use policy.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-url">Project URL</Label>
              <Input
                id="project-url"
                placeholder="https://your-project.com"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL of the project where you'll be using this API key.
                We may revoke access if the URL provided is invalid or if the
                project is not owned by you.
              </p>
            </div>

            <div className="grid gap-2">
              <h4 className="font-medium">Terms of Use</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                <li>One API key per user account</li>
                <li>100 requests per month on the free tier</li>
                <li>
                  API key must be used from the specified project URL only
                </li>
                <li>We may revoke access if terms are violated</li>
                <li>Contact us for higher usage limits</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Cancel
            </Button>
            <Button onClick={createApiKey} disabled={loading}>
              Accept & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
