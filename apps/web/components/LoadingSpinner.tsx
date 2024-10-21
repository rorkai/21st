export const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-background">
    <div className="relative w-4 h-4">
      <div className="absolute inset-0 bg-foreground/30 rounded-full animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-foreground rounded-full animate-pulse-fast"></div>
    </div>
    <span className="ml-3 text-foreground">Loading...</span>
  </div>
)
