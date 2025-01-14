import { useState, useId, useRef, ChangeEvent } from "react"
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
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"

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
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [open, setOpen] = useState(false)
  const previewImageDataUrl = form.watch("preview_image_data_url")
  const descriptionId = useId()
  const registryId = useId()
  const licenseId = useId()
  const websiteId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const defaultRows = 3

  const handleTextareaInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = "auto"

    const style = window.getComputedStyle(textarea)
    const borderHeight =
      parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth)
    const paddingHeight =
      parseInt(style.paddingTop) + parseInt(style.paddingBottom)

    const newHeight = textarea.scrollHeight + borderHeight

    textarea.style.height = `${newHeight}px`
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="w-full">
        <NameSlugForm
          form={form}
          isSlugReadOnly={true}
          placeholderName={form.getValues("name")}
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={descriptionId}>
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={descriptionId}
            {...form.register("description", {
              onChange: (e) => handleTextareaInput(e),
              required: true,
            })}
            placeholder="Add some description to help others discover your component"
            ref={(e) => {
              if (e) {
                const style = window.getComputedStyle(e)
                const lineHeight = parseInt(style.lineHeight)
                const borderHeight =
                  parseInt(style.borderTopWidth) +
                  parseInt(style.borderBottomWidth)
                const paddingHeight =
                  parseInt(style.paddingTop) + parseInt(style.paddingBottom)
                const initialHeight =
                  lineHeight * defaultRows + borderHeight + paddingHeight
                e.style.height = `${initialHeight}px`
              }
            }}
            rows={defaultRows}
            className="min-h-[none] resize-none"
            required
          />
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            A brief description of what your component does
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={registryId}>
              Registry <span className="text-destructive">*</span>
            </Label>
            <FormField
              control={form.control}
              name="registry"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  required
                >
                  <SelectTrigger id={registryId}>
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
            <p
              className="text-xs text-muted-foreground"
              role="region"
              aria-live="polite"
            >
              The category your component belongs to
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={licenseId}>
              License <span className="text-destructive">*</span>
            </Label>
            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  required
                >
                  <SelectTrigger id={licenseId}>
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
            <p
              className="text-xs text-muted-foreground"
              role="region"
              aria-live="polite"
            >
              Choose how others can use your component
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={websiteId}>Website URL</Label>
          <div className="relative">
            <Input
              type="text"
              id={websiteId}
              {...form.register("website_url", {
                onChange: (e) => {
                  // Remove www. from the input
                  const value = e.target.value
                  if (value.startsWith("www.")) {
                    e.target.value = value.slice(4)
                    form.setValue("website_url", value.slice(4))
                  }
                },
              })}
              placeholder="your-website.com"
              className="w-full peer ps-16"
            />
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground peer-disabled:opacity-50">
              https://
            </span>
          </div>
          <p
            className="text-xs text-muted-foreground"
            role="region"
            aria-live="polite"
          >
            Link to your component's documentation or demo
          </p>
        </div>
      </div>
    </div>
  )
}
