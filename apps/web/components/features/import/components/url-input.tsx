import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UseFormReturn } from "react-hook-form"
import { LoaderCircle } from "lucide-react"

interface UrlFormData {
  url: string
}

interface UrlInputProps {
  form: UseFormReturn<UrlFormData>
  isLoading: boolean
  onFetch: (url: string) => Promise<void>
}

export function UrlInput({ form, isLoading, onFetch }: UrlInputProps) {
  const extractUrl = (input: string) => {
    // Try to match URL in installation command
    const urlMatch = input.match(/add\s+"?(https?:\/\/[^"\s]+)"?/)
    return urlMatch ? urlMatch[1] : input
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const inputValue = form.getValues("url") || ""
    const url = extractUrl(inputValue)
    if (!url) return
    await onFetch(url)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
        <div className="space-y-3">
          <Label className="text-center block text-lg font-semibold">
            Import Component
          </Label>
          <p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
            Paste a URL to the component JSON file or use the full installation
            command to import your component
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            {...form.register("url")}
            placeholder="https://ui.aceternity.com/registry/sparkles.json"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading} className="sm:w-24">
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              "Fetch"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
