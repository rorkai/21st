"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TermsDialogProps {
  open: boolean
  onAccept: () => void
  onClose: () => void
}

export function TermsDialog({ open, onAccept, onClose }: TermsDialogProps) {
  const [hasReadToBottom, setHasReadToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const content = contentRef.current
    if (!content) return

    const scrollPercentage =
      content.scrollTop / (content.scrollHeight - content.clientHeight)
    if (scrollPercentage >= 0.99 && !hasReadToBottom) {
      setHasReadToBottom(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Terms of Use</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Please read and accept our terms of use before creating an API key
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="max-h-[300px] overflow-y-auto space-y-4 px-2 sm:px-4">
            <div className="space-y-2">
              <h3 className="font-medium">API Usage Guidelines</h3>
              <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                <li>Use the API key only for your own projects</li>
                <li>Do not share your API key with others</li>
                <li>Respect the rate limits of your plan</li>
                <li>Keep your API key secure and confidential</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Compliance</h3>
              <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                <li>Follow our acceptable use policy</li>
                <li>Do not use the API for malicious purposes</li>
                <li>Report any security vulnerabilities</li>
                <li>Maintain appropriate security measures</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Service Terms</h3>
              <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                <li>We may revoke API access for terms violations</li>
                <li>Service availability is not guaranteed</li>
                <li>API functionality may change without notice</li>
                <li>You are responsible for your API usage</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button onClick={onAccept} className="w-full sm:w-auto">
            Accept Terms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
