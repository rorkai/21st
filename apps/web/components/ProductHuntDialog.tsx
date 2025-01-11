"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight } from "lucide-react"
import { PH_URL } from "./product-hunt"

export function ProductHuntDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasSeenPHAnnouncement = localStorage.getItem("hasSeenPHAnnouncement")

    const timer = setTimeout(() => {
      if (!hasSeenPHAnnouncement) {
        setIsOpen(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    localStorage.setItem("hasSeenPHAnnouncement", "true")
    setIsOpen(false)
  }

  const handleSupport = () => {
    window.open(PH_URL, "_blank")
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="gap-0 p-0 [&>button:last-child]:text-white">
        <div className="relative w-full aspect-[500/405] rounded-lg overflow-hidden bg-background">
          <iframe
            src="https://cards.producthunt.com/cards/posts/771481?v=1"
            width="500"
            height="405"
            className="absolute inset-0 w-full h-full"
            style={{
              border: "none",
            }}
            loading="lazy"
          />
        </div>
        <div className="space-y-6 px-6 pb-6 pt-3">
          <DialogHeader>
            <DialogTitle>We're Live on Product Hunt! 🎉</DialogTitle>
            <DialogDescription>
              We've just launched on Product Hunt and would love your support!
              Your upvote means a lot to us and helps us reach more developers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Skip
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button className="group" type="button" onClick={handleSupport}>
                Support us
                <ArrowRight
                  className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
