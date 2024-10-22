/* eslint-disable @next/next/no-img-element */
import React, { useState, useCallback, useEffect, useRef } from "react"
import { Controller, useController, UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hotkey } from "@/components/ui/hotkey"
import {
  makeSlugFromName,
  generateUniqueSlug,
  useIsCheckSlugAvailable,
} from "./useIsCheckSlugAvailable"
import { FormData, isFormValid } from "./utils"
import { useDropzone } from "react-dropzone"
import { CloudUpload } from "lucide-react"
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
import { useClerkSupabaseClient } from "@/utils/clerk"
import { useAvailableTags } from "@/utils/dbQueries"
import { useTheme } from "next-themes"
import { useUser } from "@clerk/nextjs"
import { licenses } from "@/utils/licenses"
import { TagSelector } from "../TagSelector"
import { Separator } from "@radix-ui/react-separator"
import { debounce } from "lodash"
import { useQuery } from "@tanstack/react-query"

const ComponentDetailsForm = ({
  isEditMode,
  form,
  previewImage,
  handleFileChange,
  handleSubmit,
  isSubmitting,
}: {
  isEditMode?: boolean
  form: UseFormReturn<FormData>
  previewImage: string | null
  // eslint-disable-next-line no-unused-vars
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  // eslint-disable-next-line no-unused-vars
  handleSubmit: (event: React.FormEvent) => void
  isSubmitting: boolean
}) => {
  const { data: availableTags = [] } = useAvailableTags()
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"
  const [open, setOpen] = useState(false)

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
    <div
      className={`flex flex-col gap-4 w-full ${isDarkTheme ? "text-foreground" : "text-gray-700"}`}
    >
      <NameSlugForm
        form={form}
        isReadOnly={true}
        placeholderName={form.getValues("name")}
      />
      <div className="w-full">
        <Label htmlFor="description" className="block text-sm font-medium">
          Description
        </Label>
        <Input
          id="description"
          placeholder="Add some description to help others discover your component"
          {...form.register("description")}
          className="mt-1 w-full"
        />
      </div>

      <div className="w-full">
        <Label htmlFor="preview_image" className="block text-sm font-medium">
          Cover Image (1200x900 recommended)
        </Label>
        {!previewImage ? (
          <div
            {...getRootProps()}
            className={`flex flex-col !justify-between mt-1 w-full border border-dashed bg-background rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative`}
          >
            <input {...getInputProps()} id="preview_image" />
            <CloudUpload strokeWidth={1.5} className="mx-auto h-10 w-10" />
            <p className="mt-2 text-sm font-semibold">
              Click to upload&nbsp;
              <span className="text-gray-600 font-normal">
                or drag and drop
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPEG (max. 5MB)</p>
            {isDragActive && (
              <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center rounded-md">
                <p className="text-sm text-gray-600">Drop image here</p>
              </div>
            )}
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`mt-1 w-full border ${
              isDarkTheme ? "border-gray-600" : "border-gray-300"
            } rounded-md p-2 flex items-center gap-2 relative`}
          >
            <input {...getInputProps()} id="preview_image" />
            <div className="w-40 h-32 relative">
              <img
                src={previewImage}
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
            {isDragActive && (
              <div className="absolute inset-0 bg-background bg-opacity-90 flex items-center justify-center">
                <p className="text-sm text-gray-600">Drop new image here</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full mt-4">
        <label htmlFor="license" className="block text-sm font-medium">
          License
        </label>
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
        <label htmlFor="tags" className="block text-sm font-medium">
          Tags (optional)
        </label>
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
          <Hotkey keys={["⌘", "⏎"]} isBackgroundDark={true} />
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
  isReadOnly,
  isSlugManuallyEdited,
}: {
  form: UseFormReturn<FormData>
  isReadOnly: boolean
  isSlugManuallyEdited: boolean
}) => {
  const client = useClerkSupabaseClient()
  const { user } = useUser()
  const name = form.watch("name")

  const { data: generatedSlug } = useQuery({
    queryKey: ['generateUniqueSlug', name, user?.id],
    queryFn: async () => {
      if (name && !isSlugManuallyEdited && !isReadOnly) {
        return await generateUniqueSlug(client, name, user?.id ?? "")
      }
      return null
    },
    enabled: !!name && !isSlugManuallyEdited && !isReadOnly,
  })

  useEffect(() => {
    debouncedPrefillSlug(() => {
      if (generatedSlug) {
        form.setValue("component_slug", generatedSlug)
      }
    })
    return () => debouncedPrefillSlug.cancel()
  }, [generatedSlug])
}

const NameSlugForm: React.FC<{
  form: UseFormReturn<FormData>
  isReadOnly: boolean
  placeholderName?: string
}> = ({ form, isReadOnly, placeholderName = "Button" }) => {
  const { user } = useUser()
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const slug = form.watch("component_slug")
  const {
    isAvailable: slugAvailable,
    isChecking: isSlugChecking,
    error: slugError,
  } = useIsCheckSlugAvailable({
    slug,
    userId: user?.id ?? "",
    enabled: !isReadOnly,
  })

  if (
    slugAvailable !== undefined &&
    form.getValues("slug_available") !== slugAvailable
  ) {
    form.setValue("slug_available", slugAvailable)
  }

  usePrefillAutogeneratedSlug({ form, isReadOnly, isSlugManuallyEdited })

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
            const generatedSlug = makeSlugFromName(e.target.value)
            form.setValue("component_slug", generatedSlug)
          }}
          onBlur={nameField.onBlur}
          className="mt-1 w-full"
          disabled={isReadOnly}
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
          disabled={isReadOnly || (isSlugChecking && !isSlugManuallyEdited)}
          onChange={(e) => {
            setIsSlugManuallyEdited(true)
            form.setValue("component_slug", e.target.value)
          }}
        />

        {!slug && (
          <p className="text-gray-500 text-sm mt-1">
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
              <p className="text-gray-500 text-sm mt-1">
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
