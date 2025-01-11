export const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <div className="w-full h-full flex items-center justify-center bg-background">
    <div className="relative w-4 h-4">
      <div className="absolute inset-0 bg-foreground/30 rounded-full animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-foreground rounded-full animate-pulse-fast"></div>
    </div>
    <span className="ml-3 text-foreground">{text}</span>
  </div>
)

export const LoadingSpinnerPage = () => (
  <div className="w-full h-screen flex items-center justify-center bg-background">
    <LoadingSpinner />
  </div>
)
