import React, { useId } from "react"
import { UseFormReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { FormData } from "../utils"
import { useVideoDropzone } from "../hooks/use-video-dropzone"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import UploadIcon from "@/components/UploadIcon"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useAvailableTags } from "@/lib/queries"
import MultipleSelector, { Option } from "@/components/ui/multiselect"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form"
import { makeSlugFromName } from "../hooks/use-is-check-slug-available"

export const DemoDetailsForm = ({
  form,
  demoIndex,
}: {
  form: UseFormReturn<FormData>
  demoIndex: number
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
    if (demoIndex === 0) {
      const currentName = form.getValues(`demos.${demoIndex}.name`)
      if (!currentName) {
        handleDemoNameChange("Default")
      }
    }
  }, [demoIndex, form])

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
        form.setValue(
          `demos.${demoIndex}.preview_image_data_url`,
          e.target?.result as string,
        )
      }
      reader.readAsDataURL(file)
      form.setValue(`demos.${demoIndex}.preview_image_file`, file)
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
    const demoSlug = makeSlugFromName(name)
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
      </div>
    </div>
  )
}
