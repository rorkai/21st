import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  text?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export const LoadingSpinner = ({
  text = "Loading...",
  size = "md",
  showText = true,
  className,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  }

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-background",
        className,
      )}
    >
      <div className={cn("relative", sizeClasses[size])}>
        <div className="absolute inset-0 bg-foreground/30 rounded-full animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-foreground rounded-full animate-pulse-fast"></div>
      </div>
      {showText && <span className="ml-3 text-foreground">{text}</span>}
    </div>
  )
}

export const LoadingSpinnerPage = ({
  text,
  size,
  showText,
  className,
}: LoadingSpinnerProps) => (
  <div
    className={cn(
      "w-full h-screen flex items-center justify-center bg-background",
      className,
    )}
  >
    <LoadingSpinner text={text} size={size} showText={showText} />
  </div>
)
