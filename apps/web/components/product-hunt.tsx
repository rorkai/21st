import { ShimmerButton } from "@/components/ui/shimmer-button"
import { cn } from "@/lib/utils"

export const PH_URL = "https://www.producthunt.com/posts/21st-dev-2"

export function ProductHuntAnnouncement({ className }: { className?: string }) {
  return (
    <a
      href={PH_URL}
      target="_blank"
      className={cn("w-full bg-muted px-4 py-3 md:py-2", className)}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <p className="text-md text-foreground">
          <span className="font-medium">🎉</span>
          <span className="mx-1"></span>
          <span className="font-medium">Launch day</span>
          <span className="mx-2 text-muted-foreground">•</span>
          Support 21st.dev on Product Hunt today
        </p>
        <ShimmerButton className="min-w-24 py-2 px-4">
          <span className="text-md font-medium text-foreground">
            Support us
          </span>
        </ShimmerButton>
      </div>
    </a>
  )
}
