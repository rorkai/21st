import React, { useState, useMemo, useCallback } from "react"
import { Controller, UseFormReturn } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CreatableSelect from "react-select/creatable"
import Image from "next/image"
import { generateSlug } from "@/hooks/useComponentSlug"
import { FormData, TagOption } from "./ComponentFormUtils"
import { Globe, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useDropzone } from "react-dropzone"
import { CloudUpload } from "lucide-react"
import { X } from "lucide-react"
import { useAtom } from "jotai"
import {
  isSlugManuallyEditedAtom,
  slugCheckingAtom,
  slugErrorAtom,
  slugAvailableAtom,
} from "./ComponentFormAtoms"

interface ComponentConfirmationFormProps {
  isConfirmDialogOpen: boolean
  setIsConfirmDialogOpen: (open: boolean) => void
  form: UseFormReturn<FormData>
  slugChecking: boolean
  slugError: string | null
  slugAvailable: boolean | null
  checkSlug: (slug: string) => void
  generateAndSetSlug: (name: string) => Promise<void>
  availableTags: { id: number; name: string }[]
  previewImage: string | null
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (event: React.FormEvent) => void
  isLoading: boolean
  isFormValid: (...args: any[]) => boolean
  demoCodeError: string | null
  internalDependencies: Record<string, string>
}

export default function ComponentConfirmationForm({
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  form,
  checkSlug,
  generateAndSetSlug,
  availableTags,
  previewImage,
  handleFileChange,
  handleSubmit,
  isLoading,
  isFormValid,
  demoCodeError,
  internalDependencies,
}: ComponentConfirmationFormProps) {
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useAtom(
    isSlugManuallyEditedAtom,
  )
  const [slugChecking, setSlugChecking] = useAtom(slugCheckingAtom)
  const [slugError, setSlugError] = useAtom(slugErrorAtom)
  const [slugAvailable, setSlugAvailable] = useAtom(slugAvailableAtom)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileChange({ target: { files: acceptedFiles } } as any)
      }
    },
    [handleFileChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    multiple: false,
  })

  return (
    <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Component Details</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="w-full">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <Input
              id="name"
              placeholder="Button"
              {...form.register("name", { required: true })}
              className="mt-1 w-full"
              onChange={(e) => {
                form.setValue("name", e.target.value)
                generateAndSetSlug(e.target.value)
              }}
            />
          </div>

          <div className="w-full">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <Input
              id="description"
              placeholder="Displays a button or a component that looks like a button"
              {...form.register("description")}
              className="mt-1 w-full"
            />
          </div>

          <div className="w-full">
            <Label
              htmlFor="preview_image"
              className="block text-sm font-medium text-gray-700"
            >
              Cover Image
            </Label>
            {!previewImage ? (
              <div
                {...getRootProps()}
                className={`mt-1 w-full border border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors`}
              >
                <input {...getInputProps()} id="preview_image" />
                <CloudUpload strokeWidth={1.5} className="mx-auto h-10 w-10" />
                <p className="mt-2 text-sm font-semibold">
                  Click to upload&nbsp;
                  <span className="text-gray-600 font-normal">or drop</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPEG (max 5MB)
                </p>
              </div>
            ) : (
              <div className="mt-1 w-full border border-gray-300 rounded-md p-2 flex items-center space-x-4">
                <div className="w-40 h-32 relative">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-sm border shadow-sm"
                  />
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex-grow">
                    <h4 className="text-sm font-medium mb-1">Cover Image</h4>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
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
                      Change Preview
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700"
            >
              Tags (optional)
            </label>
            <Controller
              name="tags"
              control={form.control}
              defaultValue={[]}
              render={({ field }) => {
                const [tags, setTags] = useState(field.value)

                const selectOptions = useMemo(
                  () =>
                    availableTags.map((tag) => ({
                      value: tag.id,
                      label: tag.name,
                    })),
                  [availableTags],
                )

                return (
                  <CreatableSelect<TagOption, true>
                    {...field}
                    isMulti
                    options={selectOptions}
                    className="mt-1 w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Select or create tags"
                    formatCreateLabel={(inputValue: string) =>
                      `Create "${inputValue}"`
                    }
                    onChange={(newValue) => {
                      const formattedValue = newValue.map((item: any) => ({
                        id: item.__isNew__ ? undefined : item.value,
                        name: item.label,
                        slug: generateSlug(item.label),
                      }))
                      setTags(formattedValue)
                      field.onChange(formattedValue)
                    }}
                    value={tags.map((tag) => ({
                      value: tag.id ?? -1,
                      label: tag.name,
                    }))}
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                )
              }}
            />
          </div>

          <div className="w-full">
            <label
              htmlFor="component_slug"
              className="block text-sm font-medium text-gray-700"
            >
              Slug
            </label>
            <Input
              id="component_slug"
              {...form.register("component_slug", { required: true })}
              className="mt-1 w-full"
              onChange={(e) => {
                setIsSlugManuallyEdited(true)
                checkSlug(e.target.value)
              }}
            />

            {isSlugManuallyEdited && (
              <>
                {slugChecking ? (
                  <p className="text-gray-500 text-sm mt-1">
                    Checking availability...
                  </p>
                ) : slugError ? (
                  <p className="text-red-500 text-sm mt-1">{slugError}</p>
                ) : slugAvailable === true ? (
                  <p className="text-green-500 text-sm mt-1">
                    This slug is available
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex gap-2">
              <div
                className="flex grow items-center justify-between p-2 border rounded-md cursor-pointer"
                onClick={() => form.setValue("is_public", true)}
              >
                <div className="flex items-center space-x-2">
                  <Globe size={16} />
                  <span>Everyone</span>
                </div>
                <Checkbox
                  checked={form.watch("is_public")}
                  onCheckedChange={() => form.setValue("is_public", true)}
                />
              </div>
              <div
                className="flex grow items-center justify-between p-2 border rounded-md cursor-pointer"
                onClick={() => form.setValue("is_public", false)}
              >
                <div className="flex items-center space-x-2">
                  <Lock size={16} />
                  <span>Only me</span>
                </div>
                <Checkbox
                  checked={!form.watch("is_public")}
                  onCheckedChange={() => form.setValue("is_public", false)}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {form.watch("is_public")
                ? "This component will be visible to everyone"
                : "This component will be visible only to admins"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => setIsConfirmDialogOpen(false)}
            variant="outline"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !isFormValid(
                form,
                demoCodeError,
                internalDependencies,
                slugAvailable === true,
                isSlugManuallyEdited,
              )
            }
          >
            {isLoading ? "Adding..." : "Add component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
