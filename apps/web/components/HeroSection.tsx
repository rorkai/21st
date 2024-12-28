"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { useIsMobile } from "@/hooks/use-media-query"
import { setCookie } from "@/lib/cookies"
import { AuroraBackground } from "./ui/aurora-background"
import { Button } from "./ui/button"
import { Icons } from "./icons"

export function HeroSection() {
  const router = useRouter()
  const isMobile = useIsMobile()

  const onEnterWebsite = async () => {
    await setCookie({
      name: "has_visited",
      value: "true",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
    })
    router.refresh()
  }

  useEffect(() => {
    document.body.style.overflow = "hidden"

    const handleKeyPress = async (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        await onEnterWebsite()
      }
    }
    window.addEventListener("keydown", handleKeyPress)

    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [router])

  return (
    <AuroraBackground className="fixed inset-0 z-50">
      <div className="container relative z-10 pointer-events-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="flex flex-col max-w-[720px]"
        >
          <div className="flex items-center gap-2 mb-10 md:mb-16 lg:mb-20">
            <div className="h-6 w-6 rounded-full bg-foreground" />
            <span className="text-lg font-semibold text-foreground">
              21st.dev
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-[1.2] pb-1">
            The NPM for <br />
            Design Engineers
          </h1>

          <p className="text-base sm:text-lg md:text-xl leading-relaxed mb-8 md:mb-12 bg-gradient-to-b from-muted-foreground to-muted-foreground/70 bg-clip-text text-transparent">
            Ship polished UIs faster with React Tailwind components inspired by
            shadcn/ui.
            <br />
            Built by design engineers, for design engineers. One command to
            install.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Button size="lg" variant="default" onClick={onEnterWebsite}>
              Browse components
              {!isMobile && (
                <kbd className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-muted-foreground/70 bg-muted-foreground/10 px-1.5 font-[inherit] text-[0.625rem] font-medium text-background/70">
                  ⏎
                </kbd>
              )}
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="gap-2 border-border hover:bg-accent hover:text-accent-foreground"
              asChild
            >
              <a
                href="https://github.com/rorkai/21st"
                target="_blank"
                rel="noreferrer"
              >
                <Icons.gitHub
                  className="h-4 w-4 text-foreground opacity-60"
                  aria-hidden="true"
                />
                <span className="text-foreground opacity-60">
                  Star on GitHub
                </span>
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </AuroraBackground>
  )
}
