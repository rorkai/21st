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
export const PH_URL = "https://www.producthunt.com/posts/21st-dev-2"

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
      <DialogContent className="gap-0 p-0 [&>button:last-child]:text-white dark:bg-background dark:text-foreground rounded-lg overflow-hidden">
        <div className="relative w-full aspect-[500/405] rounded-lg overflow-hidden bg-white">
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
        <div className="space-y-6 px-6 pb-6 pt-3 bg-white dark:bg-white">
          <DialogHeader>
            <DialogTitle className="dark:text-black">
              Help us become Product of the Month!
            </DialogTitle>
            <DialogDescription className="dark:text-gray-600">
              We are live on Product Hunt and would love your support!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="dark:text-black dark:hover:bg-gray-100"
              >
                Skip
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                className="group dark:bg-black dark:text-white dark:hover:bg-gray-900"
                type="button"
                onClick={handleSupport}
              >
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
