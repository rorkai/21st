"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { ApiKey } from "@/types/global"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, AlertTriangle, LoaderCircle } from "lucide-react"
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
import { TermsDialog } from "./terms-dialog"

interface ApiKeyManagerProps {
  initialKey: ApiKey | null
  userId: string | null
}

export function ApiKeyManager({ initialKey, userId }: ApiKeyManagerProps) {
  const [key, setKey] = useState<ApiKey | null>(initialKey)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projectUrl, setProjectUrl] = useState("")
  const supabase = useClerkSupabaseClient()

  if (!userId) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            Your API Key
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sign in to create and manage your API keys
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <a
            href="https://accounts.21st.dev/sign-in"
            className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

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
        requests_limit: 100,
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
      setShowProjectDialog(false)
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            Your API Key
          </div>
          {!key && (
            <Button
              onClick={() => setShowTerms(true)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Create API Key
            </Button>
          )}
          {key && (
            <span className="text-sm text-muted-foreground">
              Contact Serafim to upgrade your plan
            </span>
          )}
        </div>

        <div className="grid gap-4">
          {!key ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You haven't created an API key yet. Create one to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 p-3 sm:p-4 rounded-lg border bg-card text-card-foreground">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="grid gap-3 flex-1">
                  <Code
                    code={key.key}
                    language="bash"
                    fontSize="sm"
                    display="block"
                    className="m-0 break-all"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
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
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex flex-col sm:flex-row justify-between text-sm gap-1">
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
        </div>
      </div>

      <TermsDialog
        open={showTerms}
        onAccept={() => {
          setShowTerms(false)
          setShowProjectDialog(true)
        }}
        onClose={() => setShowTerms(false)}
      />

      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project URL</DialogTitle>
            <DialogDescription>
              Enter the URL of the project where you'll be using this API key
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
                We may revoke access if the URL provided is invalid or if the
                project is not owned by you.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-[inherit]">
            <Button
              variant="outline"
              onClick={() => setShowProjectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createApiKey}
              disabled={loading}
              className="relative min-w-24"
            >
              {loading ? (
                <LoaderCircle
                  className="animate-spin"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                "Create Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
