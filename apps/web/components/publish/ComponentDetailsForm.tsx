import React, { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NameSlugForm } from "./forms/NameSlugForm"
import { FormData } from "./utils"
import { licenses } from "@/lib/licenses"
import { useSubmitFormHotkeys } from "./hotkeys"
import { useAvailableTags } from "@/lib/queries"
import { useTheme } from "next-themes"

export const ComponentDetailsForm = ({
  form,
  handleSubmit,
  isSubmitting,
  hotkeysEnabled = true,
}: {
  form: UseFormReturn<FormData>
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

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <NameSlugForm
        form={form}
        isSlugReadOnly={true}
        placeholderName={form.getValues("name")}
      />

      <div className="space-y-6">
        <div className="w-full">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Add some description to help others discover your component"
            onInput={handleTextareaInput}
          />
        </div>

        <div className="w-full">
          <Label htmlFor="registry">Registry</Label>
          <FormField
            control={form.control}
            name="registry"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
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
          <Label htmlFor="license">License</Label>
          <FormField
            control={form.control}
            name="license"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a license" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(licenses).map(([key, license]) => (
                    <SelectItem key={key} value={key}>
                      {license.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="w-full">
          <Label htmlFor="website_url">Website URL</Label>
          <input
            type="url"
            id="website_url"
            {...form.register("website_url")}
            placeholder="https://your-website.com"
            className="mt-1 w-full"
          />
        </div>
      </div>
    </div>
  )
}
