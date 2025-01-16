interface LoadingSpinnerProps {
  text?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export const LoadingSpinner = ({
  text = "Loading...",
  size = "md",
  showText = true,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-6 h-6"
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className={`relative ${sizeClasses[size]}`}>
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
  showText
}: LoadingSpinnerProps) => (
  <div className="w-full h-screen flex items-center justify-center bg-background">
    <LoadingSpinner text={text} size={size} showText={showText} />
  </div>
)
