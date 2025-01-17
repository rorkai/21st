import { Dialog, DialogContent } from "@/components/ui/dialog"
import { LoadingSpinner } from "./loading-spinner"

interface LoadingDialogProps {
  isOpen: boolean
  message: string
}

export function LoadingDialog({ isOpen, message }: LoadingDialogProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        hideCloseButton
        className="w-[425px] h-40 flex flex-col items-center justify-center gap-4"
      >
        <LoadingSpinner showText={false} />
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      </DialogContent>
    </Dialog>
  )
}
