import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NameSlugForm } from "../ComponentDetailsForm"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "../utils"
import { Card } from "@/components/ui/card"
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog"

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
  return (
    <div className="absolute inset-x-0 top-0 bg-background px-2 sm:px-4 md:px-4">
      <Card className="w-full max-w-[800px] mx-auto mt-4 sm:mt-20 md:mt-20 p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col justify-center w-full gap-6"
        >
          <h2 className="text-2xl font-medium">New component</h2>

          <div className="bg-muted rounded-lg p-4 flex gap-6">
            <div className="relative w-[224px] h-[126px] bg-background rounded-md overflow-hidden">
              <HeroVideoDialog
                videoSrc="https://www.youtube.com/embed/NXpSAnmleyE"
                thumbnailSrc="/tutorial-thumbnail.png"
                thumbnailAlt="Tutorial: How to publish components"
                animationStyle="from-right"
                className="w-full h-full"
              />
            </div>
            <div className="flex flex-col justify-between flex-1 py-1">
              <div>
                <h3 className="text-lg font-medium">
                  How to publish components
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Learn how to publish and share your components with the
                  community
                </p>
              </div>
              <div className="text-sm text-muted-foreground/80">
                Watch the guide on YouTube
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {isAdmin && (
              <div className="flex flex-col gap-2 mb-4">
                <Label htmlFor="publish-as" className="block text-sm font-medium">
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
            <NameSlugForm
              form={form}
              publishAsUserId={publishAsUser?.id}
              isSlugReadOnly={false}
              placeholderName={"Button"}
            />
            <Button
              className="mt-4"
              disabled={!form.watch("name") || !form.watch("slug_available")}
              size="lg"
              onClick={onContinue}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </Card>
    </div>
  )
}
