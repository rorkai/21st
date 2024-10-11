import { Loader2 } from "lucide-react"

export const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
)
