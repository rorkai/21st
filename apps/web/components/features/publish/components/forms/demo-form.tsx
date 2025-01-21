import React, { useId } from "react"
import { UseFormReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { FormData } from "../../config/utils"
import { useVideoDropzone } from "../../hooks/use-video-dropzone"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import UploadIcon from "@/components/icons/upload"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAvailableTags } from "@/lib/queries"
import MultipleSelector, { Option } from "@/components/ui/multiselect"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form"
import { makeSlugFromName } from "../../hooks/use-is-check-slug-available"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"

export const DemoDetailsForm = ({
  form,
  demoIndex,
  mode,
}: {
  form: UseFormReturn<FormData>
  demoIndex: number
  mode?: string
}) => {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const previewImageDataUrl = form.watch(
    `demos.${demoIndex}.preview_image_data_url`,
  )

  const { data: availableTags = [] } = useAvailableTags()
  const tagsId = useId()
  const previewImageId = useId()
  const previewVideoId = useId()
  const demoNameId = useId()

  React.useEffect(() => {
    if (
      mode === "full" &&
      demoIndex === 0 &&
      !form.getValues(`demos.${demoIndex}.demo_slug`)
    ) {
      form.setValue(`demos.${demoIndex}.demo_slug`, "default")
      if (!form.getValues("component_slug")) {
        const currentName = form.getValues(`demos.${demoIndex}.name`)
        if (!currentName) {
          handleDemoNameChange("Default")
        }
      }
    }
  }, [demoIndex, form, mode])

  // Convert tags to MultipleSelector options format
  const tagOptions: Option[] = availableTags.map((tag) => ({
    value: tag.slug,
    label: tag.name,
  }))

  const {
    previewVideoDataUrl,
    isProcessingVideo,
    isVideoDragActive,
    getVideoRootProps,
    getVideoInputProps,
    removeVideo,
    openFileDialog,
  } = useVideoDropzone({ form, demoIndex })

  const handleFileChange = (event: { target: { files: File[] } }) => {
    const file = event.target.files[0]

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5 MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string

        form.setValue(`demos.${demoIndex}.preview_image_data_url`, dataUrl)
      }

      form.setValue(`demos.${demoIndex}.preview_image_file`, file)

      reader.readAsDataURL(file)
    }
  }

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileChange({ target: { files: acceptedFiles } })
      }
    },
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    multiple: false,
  })

  const handleDemoNameChange = (name: string) => {
    const currentDemoSlug = form.getValues(`demos.${demoIndex}.demo_slug`)
    const shouldKeepCurrentSlug =
      mode === "full" && demoIndex === 0 && currentDemoSlug === "default"
    const demoSlug = shouldKeepCurrentSlug ? "default" : makeSlugFromName(name)

    form.setValue(`demos.${demoIndex}.name`, name)
    form.setValue(`demos.${demoIndex}.demo_slug`, demoSlug)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={demoNameId}>
            Demo Name <span className="text-destructive">*</span>
          </Label>
          <FormField
            control={form.control}
            name={`demos.${demoIndex}.name`}
            render={({ field }) => (
              <Input
                id={demoNameId}
                placeholder="Enter demo name"
                {...field}
                onChange={(e) => {
                  handleDemoNameChange(e.target.value)
                }}
              />
            )}
          />
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            A name that describes this demo implementation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={tagsId}>
            Tags <span className="text-destructive">*</span>
          </Label>
          <div>
            <MultipleSelector
              value={form.watch(`demos.${demoIndex}.tags`)?.map((tag) => ({
                value: tag.slug,
                label: tag.name,
              }))}
              onChange={(options) => {
                form.setValue(
                  `demos.${demoIndex}.tags`,
                  options.map((option) => ({
                    name: option.label,
                    slug: option.value,
                  })),
                )
              }}
              defaultOptions={tagOptions}
              options={tagOptions}
              placeholder="Search tags..."
              creatable={true}
              emptyIndicator={
                <p className="text-center text-sm">No tags found</p>
              }
              onSearchSync={(search) => {
                if (!search) return tagOptions
                return tagOptions.filter(
                  (option) =>
                    option.label.toLowerCase().includes(search.toLowerCase()) ||
                    option.value.toLowerCase().includes(search.toLowerCase()),
                )
              }}
            />
          </div>
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            Add tags to help others discover your component
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={previewImageId}>
            Cover Image <span className="text-destructive">*</span>
          </Label>
          {!previewImageDataUrl ? (
            <div
              {...getImageRootProps()}
              className={`flex flex-col !justify-between w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative`}
            >
              <input {...getImageInputProps()} id={previewImageId} />
              <UploadIcon />
              <p className="mt-2 text-xs font-medium">
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
                  <p className="text-xs text-muted-foreground">
                    Drop image here
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              {...getImageRootProps()}
              className={`w-full border ${
                isDarkTheme ? "border-gray-600" : "border-gray-300"
              } rounded-md p-2 flex items-center gap-2 relative`}
            >
              <input {...getImageInputProps()} id={previewImageId} />
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
                          })
                        }
                      }
                      input.click()
                    }}
                  >
                    Change cover
                  </Button>
                  <div className="h-px bg-border w-full" />
                  <span className="text-sm text-muted-foreground self-center">
                    or drop it here
                  </span>
                </div>
              </div>
              {isImageDragActive && (
                <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    Drop new image here
                  </p>
                </div>
              )}
            </div>
          )}
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            A preview image that represents your component (1200x900
            recommended)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={previewVideoId}>Video Preview</Label>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          {!previewVideoDataUrl ? (
            <div
              {...getVideoRootProps()}
              className={`flex flex-col !justify-between w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative`}
            >
              <input {...getVideoInputProps()} id={previewVideoId} />
              <UploadIcon />
              <p className="mt-2 text-xs font-medium">
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
                  <p className="text-xs text-muted-foreground">
                    Processing video...
                  </p>
                </div>
              )}
              {isVideoDragActive && (
                <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                  <p className="text-xs text-muted-foreground">
                    Drop video here
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "w-full border rounded-md p-2 flex items-center gap-2 relative",
                isDarkTheme ? "border-gray-600" : "border-gray-300",
              )}
            >
              <div className="w-40 h-32 relative">
                <video
                  src={previewVideoDataUrl || ""}
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
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            A short video demonstrating animation or interaction with your
            component
          </p>
        </div>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Advanced
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Demo Slug</Label>
              <FormField
                control={form.control}
                name={`demos.${demoIndex}.demo_slug`}
                render={({ field }) => (
                  <Input placeholder="demo-slug" {...field} />
                )}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier for this demo
              </p>
            </div>

            <div className="space-y-2">
              <Label>Registry Dependencies</Label>
              <FormField
                control={form.control}
                name={`demos.${demoIndex}.demo_direct_registry_dependencies`}
                render={({ field }) => (
                  <Textarea
                    placeholder='["username/component-slug"]'
                    className="font-mono text-sm"
                    value={JSON.stringify(field.value || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const value = JSON.parse(e.target.value)
                        if (Array.isArray(value)) {
                          field.onChange(value)
                        }
                      } catch (e) {
                        // Invalid JSON, ignore
                      }
                    }}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Direct dependencies from the registry
              </p>
            </div>

            <div className="space-y-2">
              <Label>NPM Dependencies</Label>
              <FormField
                control={form.control}
                name={`demos.${demoIndex}.demo_dependencies`}
                render={({ field }) => (
                  <Textarea
                    placeholder='{"package": "^1.0.0"}'
                    className="font-mono text-sm"
                    value={JSON.stringify(field.value || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const value = JSON.parse(e.target.value)
                        if (typeof value === "object" && value !== null) {
                          field.onChange(value)
                        }
                      } catch (e) {
                        // Invalid JSON, ignore
                      }
                    }}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                NPM package dependencies
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
