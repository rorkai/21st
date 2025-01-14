import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "../utils"
import { Card } from "@/components/ui/card"
import { ComponentDetailsForm } from "../ComponentDetailsForm"
import { Icons } from "@/components/icons"
import { LinkPreview } from "@/components/ui/link-preview"
import { useAnimation } from "framer-motion"

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
      <Card className="w-full max-w-[800px] mx-auto mt-4 sm:mt-20 md:mt-20 p-4 sm:p-6 md:p-8">
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
                className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-2.5 h-8 text-xs font-medium text-muted-foreground hover:text-accent-foreground"
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
              disabled={!form.watch("name") || !form.watch("slug_available")}
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
