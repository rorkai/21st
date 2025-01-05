/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react"
import { Controller, useController, UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  makeSlugFromName,
  generateUniqueSlug,
  useIsCheckSlugAvailable,
} from "./use-is-check-slug-available"
import { FormData, isFormValid } from "./utils"
import { useDropzone } from "react-dropzone"
import UploadIcon from "@/components/UploadIcon"
import { Check, ChevronsUpDown } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useAvailableTags } from "@/lib/queries"
import { useTheme } from "next-themes"
import { useUser } from "@clerk/nextjs"
import { licenses } from "@/lib/licenses"
import { TagSelector } from "../TagSelector"
import { Separator } from "@radix-ui/react-separator"
import { debounce } from "lodash"
import { useQuery } from "@tanstack/react-query"
import { useSubmitFormHotkeys } from "./hotkeys"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormField } from "../ui/form"
import { Textarea } from "../ui/textarea"
import { useVideoDropzone } from "./use-video-dropzone"

const ComponentDetailsForm = ({
  isEditMode,
  form,
  handleSubmit,
  isSubmitting,
  hotkeysEnabled = true,
}: {
  isEditMode?: boolean
  form: UseFormReturn<FormData>
  // eslint-disable-next-line no-unused-vars
  handleSubmit: (event: React.FormEvent) => void
  isSubmitting: boolean
  hotkeysEnabled?: boolean
}) => {
  useSubmitFormHotkeys(form, handleSubmit, hotkeysEnabled)
  const { data: availableTags = [] } = useAvailableTags()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [open, setOpen] = useState(false)
  const previewImageDataUrl = form.watch("preview_image_data_url")

  const {
    previewVideoDataUrl,
    isProcessingVideo,
    isVideoDragActive,
    getVideoRootProps,
    getVideoInputProps,
    removeVideo,
    openFileDialog,
  } = useVideoDropzone({ form })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5 MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        form.setValue("preview_image_data_url", e.target?.result as string)
      }
      reader.readAsDataURL(file)
      form.setValue("preview_image_file", file)
    }
  }

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileChange({ target: { files: acceptedFiles } } as any)
      }
    },
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    multiple: false,
  })

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = "auto"

    const style = window.getComputedStyle(textarea)
    const borderHeight =
      parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth)

    textarea.style.height = `${textarea.scrollHeight + borderHeight}px`
  }

  return (
    <div
      className={`flex flex-col gap-4 w-full ${isDarkTheme ? "text-foreground" : "text-muted-foreground"}`}
    >
      <NameSlugForm
        form={form}
        isSlugReadOnly={true}
        placeholderName={form.getValues("name")}
      />
      <div className="w-full">
        <Label htmlFor="description" className="block text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Add some description to help others discover your component"
          {...form.register("description")}
          className="mt-1 w-full text-foreground min-h-[none] resize-none"
          onInput={handleTextareaInput}
          rows={2}
        />
      </div>

      <div className="w-full">
        <Label htmlFor="preview_image" className="block text-sm font-medium">
          Cover Image (1200x900 recommended)
        </Label>
        {!previewImageDataUrl ? (
          <div
            {...getImageRootProps()}
            className={`flex flex-col !justify-between mt-1 w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative`}
          >
            <input {...getImageInputProps()} id="preview_image" />
            <UploadIcon />
            <p className="mt-2 text-sm font-medium">
              Click to upload&nbsp;
              <span className="text-muted-foreground font-normal">
                or drag and drop
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPEG (max. 5MB)
            </p>
            {isImageDragActive && (
              <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                <p className="text-sm text-muted-foreground">Drop image here</p>
              </div>
            )}
          </div>
        ) : (
          <div
            {...getImageRootProps()}
            className={`mt-1 w-full border ${
              isDarkTheme ? "border-gray-600" : "border-gray-300"
            } rounded-md p-2 flex items-center gap-2 relative`}
          >
            <input {...getImageInputProps()} id="preview_image" />
            <div className="w-40 h-32 relative">
              <img
                src={previewImageDataUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                className="rounded-sm border shadow-sm"
              />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = "image/jpeg, image/png"
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        handleFileChange({
                          target: { files: [file] },
                        } as any)
                      }
                    }
                    input.click()
                  }}
                >
                  Change cover
                </Button>
                <Separator
                  orientation="horizontal"
                  className="w-full h-[1px] bg-border"
                />
                <span className="text-sm text-muted-foreground self-center">
                  or drop it here
                </span>
              </div>
            </div>
            {isImageDragActive && (
              <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Drop new image here
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <Label htmlFor="preview_video" className="text-sm font-medium">
            Video Preview
          </Label>
          <span className="text-sm text-muted-foreground">Optional</span>
        </div>
        {!previewVideoDataUrl ? (
          <div
            {...getVideoRootProps()}
            className={`flex flex-col !justify-between mt-1 w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative`}
          >
            <input {...getVideoInputProps()} id="preview_video" />
            <UploadIcon />
            <p className="mt-2 text-sm font-medium">
              Click to upload&nbsp;
              <span className="text-muted-foreground font-normal">
                or drag and drop
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MOV, MP4 (max. 50MB)
            </p>
            {isProcessingVideo && (
              <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                <p className="text-sm text-muted-foreground">
                  Processing video...
                </p>
              </div>
            )}
            {isVideoDragActive && (
              <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                <p className="text-sm text-muted-foreground">Drop video here</p>
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "mt-1 w-full border rounded-md p-2 flex items-center gap-2 relative",
              isDarkTheme ? "border-gray-600" : "border-gray-300",
            )}
          >
            <div className="w-40 h-32 relative">
              <video
                src={previewVideoDataUrl}
                controls
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                className="rounded-sm border shadow-sm"
              />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={openFileDialog}>
                  Change video
                </Button>
                <Button variant="outline" onClick={removeVideo}>
                  Remove video
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full">
        <Label htmlFor="license" className="block text-sm font-medium">
          License
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between mt-1 h-9"
            >
              {form.getValues("license")
                ? licenses.find((l) => l.value === form.getValues("license"))
                    ?.label
                : "Select license..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Select license..." />
              <CommandList>
                <CommandEmpty>No licenses found</CommandEmpty>
                <CommandGroup>
                  {licenses.map((l) => (
                    <CommandItem
                      key={l.value}
                      value={l.value}
                      onSelect={(currentValue) => {
                        if (!currentValue) return
                        form.setValue("license", currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          form.getValues("license") === l.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {l.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <Label htmlFor="tags" className="text-sm font-medium">
            Tags
          </Label>
          <span className="text-sm text-muted-foreground">Optional</span>
        </div>
        <Controller
          name="tags"
          control={form.control}
          defaultValue={[]}
          render={({ field }) => {
            const [tags, setTags] = useState<
              { name: string; slug: string; id?: number }[]
            >(field.value)

            const createTag = (inputValue: string) => ({
              name: inputValue,
              slug: makeSlugFromName(inputValue),
              id: undefined,
            })

            return (
              <TagSelector
                availableTags={availableTags}
                selectedTags={tags}
                onChange={(newTags) => {
                  setTags(newTags)
                  field.onChange(newTags)
                }}
                getValue={(tag) => tag.slug}
                getLabel={(tag) => tag.name}
                createTag={createTag}
              />
            )
          }}
        />
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <Label htmlFor="website_url" className="text-sm font-medium">
            Website
          </Label>
          <span className="text-sm text-muted-foreground">Optional</span>
        </div>
        <div className="relative mt-1">
          <Controller
            name="website_url"
            control={form.control}
            render={({ field }) => (
              <Input
                id="website_url"
                placeholder="google.com"
                className="ps-16 text-foreground w-full"
                value={field.value?.replace(/^https?:\/\//, "") || ""}
                onChange={(e) => {
                  const displayValue = e.target.value.replace(
                    /^https?:\/\//,
                    "",
                  )
                  const fullValue = displayValue
                    ? `https://${displayValue}`
                    : ""
                  field.onChange(fullValue)
                }}
              />
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
            https://
          </span>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        size="lg"
        disabled={isSubmitting || !isFormValid(form)}
      >
        {isSubmitting
          ? isEditMode
            ? "Saving..."
            : "Adding..."
          : isEditMode
            ? "Save changes"
            : "Add component"}
        {!isSubmitting && isFormValid(form) && (
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans  text-[11px] text-muted leading-none  opacity-100 flex">
            <span className="text-[11px] leading-none font-sans">
              {navigator?.platform?.toLowerCase()?.includes("mac")
                ? "⌘"
                : "Ctrl"}
            </span>
            ⏎
          </kbd>
        )}
      </Button>
    </div>
  )
}

const useAutoFocusNameInput = (
  nameInputRef: React.RefObject<HTMLInputElement>,
) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])
}

const debouncedPrefillSlug = debounce((prefillSlug: () => void) => {
  prefillSlug()
}, 200)

const usePrefillAutogeneratedSlug = ({
  form,
  isSlugReadOnly,
  isSlugManuallyEdited,
  publishAsUserId,
}: {
  form: UseFormReturn<FormData>
  isSlugReadOnly: boolean
  isSlugManuallyEdited: boolean
  publishAsUserId?: string | null
}) => {
  const client = useClerkSupabaseClient()
  const { user: currentUser } = useUser()
  const userId = publishAsUserId ?? currentUser?.id
  const name = form.watch("name")

  const { data: generatedSlug } = useQuery({
    queryKey: ["generateUniqueSlug", name, userId],
    queryFn: async () => {
      if (name && !isSlugManuallyEdited && !isSlugReadOnly) {
        return await generateUniqueSlug(client, name, userId ?? "")
      }
      return null
    },
    enabled: !!name && !isSlugManuallyEdited && !isSlugReadOnly,
  })

  useEffect(() => {
    if (isSlugReadOnly) return

    debouncedPrefillSlug(() => {
      if (generatedSlug) {
        form.setValue("component_slug", generatedSlug)
      }
    })
    return () => debouncedPrefillSlug.cancel()
  }, [generatedSlug, isSlugReadOnly])
}

const NameSlugForm: React.FC<{
  form: UseFormReturn<FormData>
  publishAsUserId?: string | null
  isSlugReadOnly: boolean
  placeholderName?: string
}> = ({
  form,
  publishAsUserId,
  isSlugReadOnly,
  placeholderName = "Button",
}) => {
  const { user: currentUser } = useUser()
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const slug = form.watch("component_slug")
  const userId = publishAsUserId ?? currentUser?.id
  const {
    isAvailable: slugAvailable,
    isChecking: isSlugChecking,
    error: slugError,
  } = useIsCheckSlugAvailable({
    slug,
    userId: userId ?? "",
    enabled: !isSlugReadOnly,
  })

  if (
    slugAvailable !== undefined &&
    form.getValues("slug_available") !== slugAvailable
  ) {
    form.setValue("slug_available", slugAvailable)
  }

  usePrefillAutogeneratedSlug({
    form,
    isSlugReadOnly,
    isSlugManuallyEdited,
    publishAsUserId: userId,
  })

  const nameInputRef = useRef<HTMLInputElement | null>(null)

  useAutoFocusNameInput(nameInputRef)

  const { field: nameField } = useController({
    name: "name",
    control: form.control,
    rules: { required: true },
  })

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full">
        <Label htmlFor="name" className="block text-sm font-medium">
          Name
        </Label>
        <Input
          id="name"
          ref={(e) => {
            nameField.ref(e)
            nameInputRef.current = e
          }}
          placeholder={`e.g. "${placeholderName.replace(/([a-z])([A-Z])/g, "$1 $2")}"`}
          value={nameField.value}
          onChange={(e) => {
            nameField.onChange(e)
          }}
          onBlur={nameField.onBlur}
          className="mt-1 w-full text-foreground"
        />
      </div>

      <div className="w-full">
        <Label htmlFor="registry" className="block text-sm font-medium">
          Registry
        </Label>
        <FormField
          control={form.control}
          name="registry"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              defaultValue="ui"
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select a registry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ui">ui</SelectItem>
                <SelectItem value="components">components</SelectItem>
                <SelectItem value="hooks">hooks</SelectItem>
                <SelectItem value="icons">icons</SelectItem>
                <SelectItem value="blocks">blocks</SelectItem>
                <SelectItem value="pages">pages</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="w-full">
        <Label htmlFor="component_slug" className="block text-sm font-medium">
          Slug
        </Label>
        <Input
          id="component_slug"
          {...form.register("component_slug", { required: true })}
          className="mt-1 w-full"
          placeholder={`e.g. "${makeSlugFromName(placeholderName)}"`}
          disabled={isSlugReadOnly || (isSlugChecking && !isSlugManuallyEdited)}
          onChange={(e) => {
            setIsSlugManuallyEdited(true)
            form.setValue("component_slug", e.target.value)
          }}
        />

        {!slug && (
          <p className="text-muted-foreground text-sm mt-1">
            Slug is used in the URL of your component and file imports, and
            can't be changed later
          </p>
        )}

        {slugError && (
          <p className="text-red-500 text-sm mt-1">{slugError.message}</p>
        )}

        {slug?.length > 0 && !slugError && isSlugManuallyEdited && (
          <>
            {isSlugChecking ? (
              <p className="text-muted-foreground text-sm mt-1">
                Checking slug availability...
              </p>
            ) : slugAvailable === true ? (
              <p className="text-green-500 text-sm mt-1">
                This slug is available
              </p>
            ) : (
              <p className="text-red-500 text-sm mt-1">
                You already have a component with this slug
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { ComponentDetailsForm, NameSlugForm }
