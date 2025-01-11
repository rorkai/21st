"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { useIsMobile } from "@/hooks/use-media-query"

import { Mail } from "lucide-react"
import { toast } from "sonner"

export function NewsletterDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const hasSubscribed = localStorage.getItem("hasSubscribedToNewsletter")
    const hasDeclined = localStorage.getItem("hasDeclinedNewsletter")

    const timer = setTimeout(() => {
      if (!hasSubscribed && !hasDeclined) {
        setIsOpen(true)
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    localStorage.setItem("hasDeclinedNewsletter", "true")
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const time = new Date()
    const timestamp = time.valueOf()
    const previousTimestamp = localStorage.getItem("loops-form-timestamp")

    if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
      toast.error("Too many signups, please try again in a little while")
      setIsSubmitting(false)
      return
    }

    localStorage.setItem("loops-form-timestamp", timestamp.toString())

    try {
      const formBody = `userGroup=&mailingLists=&email=${encodeURIComponent(email)}`

      const response = await fetch(
        "https://app.loops.so/api/newsletter-form/cm53que9u00xu5nps0o5zq8wj",
        {
          method: "POST",
          body: formBody,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      )

      const data = await response.json()

      if (response.ok) {
        toast.success("Thanks! We'll be in touch!")
        localStorage.setItem("hasSubscribedToNewsletter", "true")
        setIsOpen(false)
      } else {
        throw new Error(data.message || response.statusText)
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Failed to fetch") {
        toast.error("Too many signups, please try again in a little while")
        return
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to subscribe. Please try again.",
      )
      localStorage.setItem("loops-form-timestamp", "")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[425px] ${isMobile ? "mx-4" : ""}`}>
        <div className="mb-2 flex flex-col items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground"
            aria-hidden="true"
          />
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              Stay Updated with Latest UI Components
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              Join our weekly digest featuring carefully curated UI components
              and design patterns from top design engineers.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="dialog-subscribe"
                name="email"
                className="peer ps-9"
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email"
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Mail size={16} strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By subscribing you agree to our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </DialogContent>
    </Dialog>
  )
}
