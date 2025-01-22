import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Check,
  ImagePlus,
  X,
  Loader2,
  Upload,
  LoaderCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useImageUpload } from "@/hooks/use-image-upload"

const profileFormSchema = z.object({
  display_name: z.string().min(2).max(50),
  use_custom_username: z.boolean().default(false),
  display_username: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Username can only contain letters, numbers, underscores, and hyphens",
    })
    .optional(),
  display_image_url: z.string().url().optional().nullable(),
  bio: z.string().max(180).optional(),
  website_url: z.string().optional(),
  github_url: z.string().optional(),
  twitter_url: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface EditProfileDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  user: {
    name: string
    username: string
    image_url: string
    display_name?: string | null
    display_username?: string | null
    display_image_url?: string | null
    bio?: string | null
    website_url?: string | null
    github_url?: string | null
    twitter_url?: string | null
  }
  onUpdate: () => void
}

const CLERK_ACCOUNT_URL =
  process.env.NODE_ENV === "development"
    ? "https://wanted-titmouse-48.accounts.dev/user"
    : "https://accounts.21st.dev/user"

export function EditProfileDialog({
  isOpen,
  setIsOpen,
  user,
  onUpdate,
}: EditProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null)
  const {
    previewUrl,
    isDragging,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useImageUpload()

  console.log("Initial user data:", user)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: user.display_name || user.name || "",
      use_custom_username: !!user.display_username,
      display_username: user.display_username || user.username,
      display_image_url: user.display_image_url || user.image_url || "",
      bio: user.bio || "",
      website_url: user.website_url?.replace(/^https?:\/\//, "") || "",
      github_url: user.github_url?.replace(/^https?:\/\//, "") || "",
      twitter_url: user.twitter_url?.replace(/^https?:\/\//, "") || "",
    },
  })

  const useCustomUsername = form.watch("use_custom_username")

  const checkUsername = async (username: string) => {
    if (!username) {
      setIsUsernameValid(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const response = await fetch("/api/user/profile/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ display_username: username }),
      })
      const result = await response.json()
      setIsUsernameValid(!result.exists)
    } catch (error) {
      console.error("Error checking username:", error)
      setIsUsernameValid(null)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    try {
      console.log("Submitting data:", data)

      // Clean up empty strings
      const cleanData = {
        ...data,
        display_username: data.use_custom_username
          ? data.display_username
          : null,
        bio: data.bio || null,
        website_url: data.website_url || null,
        github_url: data.github_url || null,
        twitter_url: data.twitter_url || null,
        display_image_url: previewUrl || data.display_image_url || null,
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      toast.success("Profile updated successfully")
      onUpdate()
      setIsOpen(false)
    } catch (error) {
      console.error("Update error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 sm:max-w-lg h-[85vh]",
          isDragging && "ring-2 ring-primary ring-offset-2",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={async (e) => {
          const base64String = await handleDrop(e)
          if (base64String) {
            form.setValue("display_image_url", base64String)
          }
        }}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <p>Drop image here to update avatar</p>
            </div>
          </div>
        )}

        <div className="flex flex-col h-full">
          <DialogHeader className="flex-none border-b border-border">
            <DialogTitle className="px-6 py-4 text-base">
              Edit profile
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="py-6 px-1">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      src={
                        previewUrl ||
                        form.getValues("display_image_url") ||
                        undefined
                      }
                      alt={form.getValues("display_name")}
                      size={80}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleThumbnailClick}
                        className="h-9"
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Change avatar
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Or drag and drop an image anywhere
                      </p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const base64String = await handleFileChange(e)
                        if (base64String) {
                          form.setValue("display_image_url", base64String)
                        }
                      }}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="display_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {useCustomUsername ? "Username" : "GitHub Username"}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              value={
                                useCustomUsername ? field.value : user.username
                              }
                              readOnly={!useCustomUsername}
                              className={cn(
                                "pr-10",
                                !useCustomUsername &&
                                  "bg-muted text-muted-foreground",
                              )}
                              onChange={(e) => {
                                field.onChange(e)
                                checkUsername(e.target.value)
                              }}
                            />
                            {useCustomUsername && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {isCheckingUsername && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {!isCheckingUsername &&
                                  isUsernameValid === true && (
                                    <Check className="h-4 w-4 text-green-500" />
                                  )}
                                {!isCheckingUsername &&
                                  isUsernameValid === false && (
                                    <X className="h-4 w-4 text-red-500" />
                                  )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="use_custom_username"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Use different username</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={value ?? ""}
                            placeholder="Tell us about yourself"
                            className="resize-none"
                            maxLength={180}
                          />
                        </FormControl>
                        <FormDescription>
                          {180 - (value?.length || 0)} characters remaining
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <div className="flex rounded-lg shadow-sm shadow-black/5">
                            <span className="inline-flex items-center rounded-s-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                              https://
                            </span>
                            <Input
                              {...field}
                              value={value ?? ""}
                              className="z-10 -ms-px rounded-s-none shadow-none"
                              placeholder="yourwebsite.com"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="github_url"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>GitHub URL</FormLabel>
                        <FormControl>
                          <div className="flex rounded-lg shadow-sm shadow-black/5">
                            <span className="inline-flex items-center rounded-s-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                              https://
                            </span>
                            <Input
                              {...field}
                              value={value ?? ""}
                              className="z-10 -ms-px rounded-s-none shadow-none"
                              placeholder="github.com/username"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter_url"
                    render={({ field: { value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Twitter URL</FormLabel>
                        <FormControl>
                          <div className="flex rounded-lg shadow-sm shadow-black/5">
                            <span className="inline-flex items-center rounded-s-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                              https://
                            </span>
                            <Input
                              {...field}
                              value={value ?? ""}
                              className="z-10 -ms-px rounded-s-none shadow-none"
                              placeholder="twitter.com/username"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-none border-t border-border px-6 py-4">
            <div className="flex w-full items-center justify-between">
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
                onClick={() => {
                  window.open(CLERK_ACCOUNT_URL, "_blank")
                }}
              >
                Edit GitHub connection →
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="relative"
                >
                  {isLoading && (
                    <LoaderCircle
                      className="-ms-1 me-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
