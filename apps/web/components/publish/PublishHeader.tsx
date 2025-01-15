import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon } from "lucide-react"
import { FormStep } from "@/types/global"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "./utils"
import { ResolveUnknownDependenciesAlertForm } from "./alerts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Icons } from "../icons"
import { LoadingSpinner } from "../LoadingSpinner"

interface PublishHeaderProps {
  formStep: FormStep
  componentSlug: string
  activeCodeTab?: string
  setActiveCodeTab?: (value: string) => void
  setFormStep: (step: FormStep) => void
  handleSubmit?: (event: React.FormEvent) => void
  isSubmitting?: boolean
  isFormValid: boolean
  form?: UseFormReturn<FormData>
  publishProgress: string
  onAddDemo?: () => void
  currentDemoIndex: number
  setCurrentDemoIndex: (index: number) => void
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
  form,
  publishProgress,
  onAddDemo,
  currentDemoIndex,
  setCurrentDemoIndex,
}: PublishHeaderProps) {
  const [showDependenciesModal, setShowDependenciesModal] = useState(false)

  useEffect(() => {
    const demos = form?.getValues().demos || []
    if (currentDemoIndex >= demos.length) {
      setCurrentDemoIndex(Math.max(0, demos.length - 1))
    }
  }, [form?.getValues().demos?.length])

  const checkForUnknownDependencies = (code: string) => {
    if (!form || !code) return []

    const currentDemoDeps =
      form.getValues(
        `demos.${currentDemoIndex}.demo_direct_registry_dependencies`,
      ) || []

    const componentSlugToPublish = form.getValues("component_slug")

    const demoImports =
      code.match(
        /import\s+{([^}]+)}\s+from\s+["']@\/components\/ui\/([^"']+)["']/g,
      ) || []

    const newDeps = demoImports
      .map((imp) => {
        const match = imp.match(/\/ui\/([^"']+)/)
        if (!match?.[1]) return null
        const slug = match[1].replace(/\.tsx$/, "")

        if (
          slug === componentSlugToPublish ||
          currentDemoDeps.includes(`ui/${slug}`)
        )
          return null

        return {
          slugWithUsername: slug,
          registry: "ui" as const,
          isDemoDependency: true as const,
        }
      })
      .filter(
        (
          dep,
        ): dep is {
          slugWithUsername: string
          registry: "ui"
          isDemoDependency: true
        } => dep !== null,
      )

    return newDeps.filter(
      (dep) =>
        !currentDemoDeps.includes(`${dep.registry}/${dep.slugWithUsername}`),
    )
  }

  const handleDemoCodeContinue = () => {
    if (!form) return

    const currentDemo = form.watch(`demos.${currentDemoIndex}`)
    const currentDemoCode = currentDemo?.demo_code || ""

    if (!currentDemoCode?.trim()) {
      return
    }

    const unknownDeps = checkForUnknownDependencies(currentDemoCode)

    if (unknownDeps.length > 0) {
      form.setValue(
        "unknown_dependencies",
        unknownDeps.map((dep) => dep.slugWithUsername),
      )
      setShowDependenciesModal(true)
    } else {
      setFormStep("demoDetails")
    }
  }

  const handleStepChange = (newStep: FormStep) => {
    if (newStep === "demoCode") {
      const demos = form?.getValues("demos") || []
      const currentDemo = demos[currentDemoIndex]
      if (!currentDemo?.demo_code) {
        form?.setValue(`demos.${currentDemoIndex}`, {
          name: "",
          demo_code: "",
          tags: [],
          preview_image_data_url: "",
          preview_image_file: new File([], "placeholder"),
          preview_video_data_url: "",
          preview_video_file: new File([], "placeholder"),
          demo_direct_registry_dependencies: [],
        })

        form?.setValue("unknown_dependencies", [])
      }
    }

    setFormStep(newStep)
  }

  const handleDependenciesResolved = (resolvedDependencies: any[]) => {
    if (!form) return

    try {
      const nonDemoDependencies = resolvedDependencies.filter(
        (d) => !d.isDemoDependency,
      )
      const demoDependencies = resolvedDependencies.filter(
        (d) => d.isDemoDependency,
      )

      const currentDirectDeps =
        form.getValues("direct_registry_dependencies") || []
      const newDirectDeps = [
        ...new Set([
          ...currentDirectDeps,
          ...nonDemoDependencies.map((d) => `${d.username}/${d.slug}`),
        ]),
      ]
      form.setValue("direct_registry_dependencies", newDirectDeps)

      const currentDemoDeps =
        form.getValues(
          `demos.${currentDemoIndex}.demo_direct_registry_dependencies`,
        ) || []
      const newDemoDeps = [
        ...new Set([
          ...currentDemoDeps,
          ...demoDependencies.map((d) => `${d.username}/${d.slug}`),
        ]),
      ]
      form.setValue(
        `demos.${currentDemoIndex}.demo_direct_registry_dependencies`,
        newDemoDeps,
      )

      form.setValue("unknown_dependencies", [])

      setShowDependenciesModal(false)
      setFormStep("demoDetails")
    } catch (error) {
      console.error("Error updating dependencies:", error)
    }
  }

  console.log("formData", form?.getValues())

  const isDemoDetailsValid = () => {
    if (!form || formStep !== "demoDetails") return true
    const values = form.getValues()
    const currentDemo = values.demos[currentDemoIndex]
    return !!(
      currentDemo?.name &&
      currentDemo?.tags?.length > 0 &&
      currentDemo?.preview_image_data_url
    )
  }

  if (formStep === "code") {
    return (
      <div className="flex items-center justify-between min-h-12 border-b bg-background z-50 pointer-events-auto px-4 sticky top-0">
        <div className="flex-1">
          <Tabs value={activeCodeTab} onValueChange={setActiveCodeTab}>
            <TabsList className="h-auto gap-2 rounded-none bg-transparent px-0 py-1 text-foreground">
              <TabsTrigger
                value="component"
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                {componentSlug}.tsx
              </TabsTrigger>
              <TabsTrigger
                value="tailwind"
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                tailwind.config.js
              </TabsTrigger>
              <TabsTrigger
                value="globals"
                className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-2 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent data-[state=inactive]:text-foreground/70"
              >
                globals.css
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleStepChange("nameSlugForm")}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => handleStepChange("demoCode")}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  if (formStep === "demoCode" || formStep === "demoDetails") {
    return (
      <>
        <div className="flex items-center justify-between min-h-12 border-b bg-background z-50 pointer-events-auto px-4 sticky top-0">
          <Link
            href="/"
            className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer bg-foreground"
          />
          <div className="flex-1" />
          <div className="text-center font-medium mr-8">
            Create demo for {form?.getValues().name || ""}
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() =>
                  handleStepChange(
                    formStep === "demoCode" ? "code" : "demoCode",
                  )
                }
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  formStep === "demoCode"
                    ? handleDemoCodeContinue()
                    : handleStepChange("detailedForm")
                }
                disabled={formStep === "demoDetails" && !isDemoDetailsValid()}
              >
                {formStep === "demoCode" ? "Continue" : "Save demo"}
              </Button>
            </div>
          </div>
        </div>

        <Dialog
          open={showDependenciesModal}
          onOpenChange={setShowDependenciesModal}
        >
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Icons.workflowIcon />
                <DialogTitle>
                  Unknown Dependencies for Demo {currentDemoIndex + 1}
                </DialogTitle>
              </div>
            </DialogHeader>
            <ResolveUnknownDependenciesAlertForm
              unknownDependencies={(
                form?.watch("unknown_dependencies") || []
              ).map((dep) => ({
                slugWithUsername: dep,
                registry: "ui",
                isDemoDependency: true,
              }))}
              onBack={() => {
                setShowDependenciesModal(false)
                handleStepChange("demoCode")
              }}
              onDependenciesResolved={handleDependenciesResolved}
            />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (formStep === "detailedForm") {
    return (
      <div className="flex items-center justify-between min-h-12 border-b bg-background z-50 pointer-events-auto px-4 sticky top-0">
        <Link
          href="/"
          className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer bg-foreground"
        />
        <div className="flex-1" />
        <div className="text-center font-medium mr-8">Create component</div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddDemo}
              className="gap-2"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground"
              >
                <path
                  d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
              Add demo
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
              className="relative"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  <span>Publishing...</span>
                </div>
              ) : (
                "Publish"
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
