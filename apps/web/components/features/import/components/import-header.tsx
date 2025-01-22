import Link from "next/link"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFormContext } from "react-hook-form"


interface ImportHeaderProps {
  showUrlInput: boolean
  isLoading: boolean
  onSubmit: () => void
  formStep: "detailedForm" | "demoCode"
  isSubmitting: boolean
  onEditDemoCode: () => void
  onSaveDemoCode: () => void
  isEditingFromCard: boolean
}

export function ImportHeader({
  showUrlInput,
  isLoading,
  onSubmit,
  formStep,
  isSubmitting,
  onEditDemoCode,
  onSaveDemoCode,
  isEditingFromCard,
}: ImportHeaderProps) {
  const form = useFormContext()
  const currentDemo = form.watch("demos.0")
  const isValid =
    currentDemo?.tags?.length > 0 && currentDemo?.preview_image_data_url

  return (
    <div className="flex items-center justify-between min-h-12 border-b bg-background z-50 pointer-events-auto px-4 sticky top-0">
      <Link
        href="/"
        className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer bg-foreground"
      />
      <div className="flex-1" />
      <div className="text-center font-medium mr-8">
        Import component
        <Badge
          variant="secondary"
          className="h-5 text-[11px] tracking-wide font-medium uppercase px-1.5 py-0 leading-none ml-2"
        >
          beta
        </Badge>
      </div>
      <div className="flex items-center gap-2 flex-1 justify-end">
        {!showUrlInput && (
          <>
            {formStep === "demoCode" ? (
              <>
                <Button
                  variant="outline"
                  onClick={onSaveDemoCode}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button onClick={onSaveDemoCode} disabled={isLoading}>
                  Save demo
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onEditDemoCode}
                  disabled={isLoading}
                >
                  Edit demo
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting || !isValid}
                  className="relative min-w-24"
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      className="animate-spin"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    "Publish"
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
