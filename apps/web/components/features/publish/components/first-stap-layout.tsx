import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "../config/utils"
import { Card } from "@/components/ui/card"
import { ComponentDetailsForm } from "./forms/component-form"
import { Icons } from "@/components/icons"
import { LinkPreview } from "@/components/ui/link-preview"
import { useAnimation } from "framer-motion"
import { Info, ArrowRight } from "lucide-react"

interface NameSlugStepProps {
  form: UseFormReturn<FormData>
  isAdmin: boolean
  publishAsUsername: string | undefined
  publishAsUser: { id: string } | null | undefined
  onContinue: () => void
  onPublishAsChange: (username: string) => void
}

export function NameSlugStep({
  form,
  isAdmin,
  publishAsUsername,
  publishAsUser,
  onContinue,
  onPublishAsChange,
}: NameSlugStepProps) {
  const controls = useAnimation()

  const handleContinue = () => {
    // Save form values before continuing
    const formValues = form.getValues()
    form.reset(formValues)
    onContinue()
  }

  return (
    <div className="absolute inset-x-0 top-0 bg-background px-2 sm:px-4 md:px-0">
      <div className="z-[100] max-w-[800px] mx-auto mt-4 sm:mt-20 md:mt-20 mb-4 rounded-lg border border-border bg-background px-4 py-3 shadow-lg shadow-black/5">
        <div className="flex gap-2">
          <div className="flex grow gap-3">
            <Info
              className="mt-0.5 shrink-0 text-blue-500"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            <div className="flex grow justify-between gap-12">
              <p className="text-sm text-muted-foreground">
                Components go through a review process before being featured.
              </p>
              <a
                href="https://github.com/serafimcloud/21st?tab=readme-ov-file#review-process"
                target="_blank"
                rel="noopener noreferrer"
                className="group whitespace-nowrap text-sm font-medium text-primary"
              >
                Learn more
                <ArrowRight
                  className="-mt-0.5 ms-1 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
      <Card className="w-full max-w-[800px] mx-auto p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col justify-center w-full gap-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium">New component</h2>
            <LinkPreview
              url="https://www.youtube.com/watch?v=NXpSAnmleyE"
              imageSrc="/tutorial-thumbnail.png"
              isStatic
              width={160}
              height={90}
            >
              <div
                className="flex items-center gap-1.5 rounded-full border
                bg-background/50 px-2.5 h-8 text-xs font-medium 
                text-muted-foreground hover:text-accent-foreground 
                hover:border-accent-foreground/50 hover:bg-accent-foreground/10
                hover:shadow-md"
                onMouseEnter={() => controls.start("animate")}
                onMouseLeave={() => controls.start("normal")}
              >
                <div className="flex items-center justify-center">
                  <Icons.clap size={18} controls={controls} />
                </div>
                Watch Tutorial
              </div>
            </LinkPreview>
          </div>

          <div className="flex flex-col">
            {isAdmin && (
              <div className="flex flex-col gap-2 mb-4">
                <Label
                  htmlFor="publish-as"
                  className="block text-sm font-medium"
                >
                  Publish as (admin only)
                </Label>
                <Input
                  id="publish-as"
                  placeholder="Enter username"
                  value={publishAsUsername}
                  onChange={(e) => onPublishAsChange(e.target.value)}
                />
              </div>
            )}
            <ComponentDetailsForm
              form={form}
              isSlugReadOnly={false}
              publishAsUserId={publishAsUser?.id}
              placeholderName="Button"
            />
            <Button
              className="mt-4"
              disabled={
                !form.watch("name") ||
                !form.watch("description") ||
                !form.watch("slug_available")
              }
              size="lg"
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </Card>
    </div>
  )
}
