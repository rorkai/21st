import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon } from "lucide-react"
import { FormStep } from "@/types/global"

interface PublishHeaderProps {
  formStep: FormStep
  componentSlug: string
  activeCodeTab?: string
  setActiveCodeTab?: (value: string) => void
  setFormStep: (step: FormStep) => void
  handleSubmit?: (event: React.FormEvent) => void
  isSubmitting?: boolean
  isFormValid?: boolean
}

export function PublishHeader({
  formStep,
  componentSlug,
  activeCodeTab,
  setActiveCodeTab,
  setFormStep,
  handleSubmit,
  isSubmitting,
  isFormValid,
}: PublishHeaderProps) {
  if (formStep === "code") {
    return (
      <div className="flex items-center justify-between min-h-12 border-b bg-background z-50 pointer-events-auto px-4">
        <div className="flex-1">
          <Tabs value={activeCodeTab} onValueChange={setActiveCodeTab}>
            <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground">
              <TabsTrigger
                value="component"
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
              >
                {componentSlug}.tsx
              </TabsTrigger>
              <TabsTrigger
                value="tailwind"
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
              >
                tailwind.config.js
              </TabsTrigger>
              <TabsTrigger
                value="globals"
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
              >
                globals.css
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2 px-4">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setFormStep("nameSlugForm")}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setFormStep("demoCode")}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  if (formStep === "demoCode" || formStep === "demoDetails") {
    return (
      <div className="flex items-center justify-between min-h-12 border-b bg-background z-50 pointer-events-auto px-4">
        <div className="rounded-full w-7 h-7 bg-foreground" />
        <div className="flex-1" />
        <div className="text-center font-medium mr-8">
          {componentSlug}.demo.tsx
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="flex items-center gap-2 px-4">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setFormStep("code")}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setFormStep(
                formStep === "demoCode" ? "demoDetails" : "detailedForm",
              )
            }
          >
            Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (formStep === "detailedForm") {
    return (
      <div className="flex items-center justify-between min-h-12 border-b bg-background z-50 pointer-events-auto px-4">
        <div className="rounded-full w-7 h-7 bg-foreground" />
        <div className="flex-1" />
        <div className="text-center font-medium mr-8">{componentSlug}.tsx</div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="flex items-center px-4">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? "Saving..." : "Add component"}
              {!isSubmitting && isFormValid && (
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-muted leading-none opacity-100 flex">
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
        </div>
      </div>
    )
  }

  return null
}
