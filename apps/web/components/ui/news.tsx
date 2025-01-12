"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export interface NewsArticle {
  href: string
  title: string
  summary: string
  image: string
}

const OFFSET_FACTOR = 4
const SCALE_FACTOR = 0.03
const OPACITY_FACTOR = 0.1

export function News({ articles }: { articles: NewsArticle[] }) {
  const [dismissedNews, setDismissedNews] = React.useState<string[]>([])
  const cards = articles.filter(({ href }) => !dismissedNews.includes(href))
  const cardCount = cards.length
  const [showCompleted, setShowCompleted] = React.useState(cardCount > 0)

  React.useEffect(() => {
    let timeout: NodeJS.Timeout | undefined = undefined
    if (cardCount === 0)
      timeout = setTimeout(() => setShowCompleted(false), 2700)
    return () => clearTimeout(timeout)
  }, [cardCount])

  return cards.length || showCompleted ? (
    <div
      className="group overflow-hidden px-3 pb-3 pt-8"
      data-active={cardCount !== 0}
    >
      <div className="relative size-full">
        {cards.toReversed().map(({ href, title, summary, image }, idx) => (
          <div
            key={href}
            className={cn(
              "absolute left-0 top-0 size-full scale-[var(--scale)] transition-[opacity,transform] duration-200",
              cardCount - idx > 3
                ? [
                    "opacity-0 sm:group-hover:translate-y-[var(--y)] sm:group-hover:opacity-[var(--opacity)]",
                    "sm:group-has-[*[data-dragging=true]]:translate-y-[var(--y)] sm:group-has-[*[data-dragging=true]]:opacity-[var(--opacity)]",
                  ]
                : "translate-y-[var(--y)] opacity-[var(--opacity)]",
            )}
            style={
              {
                "--y": `-${(cardCount - (idx + 1)) * OFFSET_FACTOR}%`,
                "--scale": 1 - (cardCount - (idx + 1)) * SCALE_FACTOR,
                "--opacity":
                  cardCount - (idx + 1) >= 6
                    ? 0
                    : 1 - (cardCount - (idx + 1)) * OPACITY_FACTOR,
              } as React.CSSProperties
            }
            aria-hidden={idx !== cardCount - 1}
          >
            <NewsCard
              title={title}
              description={summary}
              image={image}
              href={href}
              hideContent={cardCount - idx > 2}
              active={idx === cardCount - 1}
              onDismiss={() =>
                setDismissedNews([href, ...dismissedNews.slice(0, 50)])
              }
            />
          </div>
        ))}
        <div className="pointer-events-none invisible" aria-hidden>
          <NewsCard title="Title" description="Description" />
        </div>
        {showCompleted && !cardCount && (
          <div
            className="animate-slide-up-fade absolute inset-0 flex size-full flex-col items-center justify-center gap-3 [animation-duration:1s]"
            style={{ "--offset": "10px" } as React.CSSProperties}
          >
            <div className="animate-fade-in absolute inset-0 rounded-lg border border-neutral-300 [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]" />
            <span className="animate-fade-in text-xs font-medium text-muted-foreground [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]">
              You're all caught up!
            </span>
          </div>
        )}
      </div>
    </div>
  ) : null
}

function NewsCard({
  title,
  description,
  image,
  onDismiss,
  hideContent,
  href,
  active,
}: {
  title: string
  description: string
  image?: string
  onDismiss?: () => void
  hideContent?: boolean
  href?: string
  active?: boolean
}) {
  const { isMobile } = useMediaQuery()

  const ref = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{
    start: number
    delta: number
    startTime: number
    maxDelta: number
  }>({
    start: 0,
    delta: 0,
    startTime: 0,
    maxDelta: 0,
  })
  const animation = React.useRef<Animation>()
  const [dragging, setDragging] = React.useState(false)

  const onDragMove = (e: PointerEvent) => {
    if (!ref.current) return
    const { clientX } = e
    const dx = clientX - drag.current.start
    drag.current.delta = dx
    drag.current.maxDelta = Math.max(drag.current.maxDelta, Math.abs(dx))
    ref.current.style.setProperty("--dx", dx.toString())
  }

  const dismiss = () => {
    if (!ref.current) return

    const cardWidth = ref.current.getBoundingClientRect().width
    const translateX = Math.sign(drag.current.delta) * cardWidth

    // Dismiss card
    animation.current = ref.current.animate(
      { opacity: 0, transform: `translateX(${translateX}px)` },
      { duration: 150, easing: "ease-in-out", fill: "forwards" },
    )
    animation.current.onfinish = () => onDismiss?.()
  }

  const stopDragging = (cancelled: boolean) => {
    if (!ref.current) return
    unbindListeners()
    setDragging(false)

    const dx = drag.current.delta
    if (Math.abs(dx) > ref.current.clientWidth / (cancelled ? 2 : 3)) {
      dismiss()
      return
    }

    // Animate back to original position
    animation.current = ref.current.animate(
      { transform: "translateX(0)" },
      { duration: 150, easing: "ease-in-out" },
    )
    animation.current.onfinish = () =>
      ref.current?.style.setProperty("--dx", "0")

    drag.current = { start: 0, delta: 0, startTime: 0, maxDelta: 0 }
  }

  const onDragEnd = () => stopDragging(false)
  const onDragCancel = () => stopDragging(true)

  const onPointerDown = (e: React.PointerEvent) => {
    if (!active || !ref.current || animation.current?.playState === "running")
      return

    bindListeners()
    setDragging(true)
    drag.current.start = e.clientX
    drag.current.startTime = Date.now()
    drag.current.delta = 0
    ref.current.style.setProperty("--w", ref.current.clientWidth.toString())
  }

  const onClick = () => {
    if (!ref.current) return
    if (
      isMobile &&
      drag.current.maxDelta < ref.current.clientWidth / 10 &&
      (!drag.current.startTime || Date.now() - drag.current.startTime < 250)
    ) {
      // Touch user didn't drag far or for long, open the link
      window.open(href, "_blank")
    }
  }

  const bindListeners = () => {
    document.addEventListener("pointermove", onDragMove)
    document.addEventListener("pointerup", onDragEnd)
    document.addEventListener("pointercancel", onDragCancel)
  }

  const unbindListeners = () => {
    document.removeEventListener("pointermove", onDragMove)
    document.removeEventListener("pointerup", onDragEnd)
    document.removeEventListener("pointercancel", onDragCancel)
  }

  return (
    <Card
      ref={ref}
      className={cn(
        "relative select-none gap-2 p-3 text-[0.8125rem]",
        "translate-x-[calc(var(--dx)*1px)] rotate-[calc(var(--dx)*0.05deg)] opacity-[calc(1-max(var(--dx),-1*var(--dx))/var(--w)/2)]",
        "transition-shadow data-[dragging=true]:shadow-md",
      )}
      data-dragging={dragging}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <div className={cn(hideContent && "invisible")}>
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 font-medium text-foreground">
            {title}
          </span>
          <p className="line-clamp-2 h-10 leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="relative mt-3 aspect-[16/9] w-full shrink-0 overflow-hidden rounded border bg-muted">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="10vw"
              className="rounded object-cover object-center"
              draggable={false}
            />
          )}
        </div>
        <div
          className={cn(
            "h-0 overflow-hidden opacity-0 transition-[height,opacity] duration-200",
            "sm:group-has-[*[data-dragging=true]]:h-7 sm:group-has-[*[data-dragging=true]]:opacity-100 sm:group-hover:group-data-[active=true]:h-7 sm:group-hover:group-data-[active=true]:opacity-100",
          )}
        >
          <div className="flex items-center justify-between pt-3 text-xs">
            <Link
              href={href || "https://dub.co"}
              target="_blank"
              className="font-medium text-muted-foreground hover:text-foreground transition-colors duration-75"
            >
              Read more
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground transition-colors duration-75"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
