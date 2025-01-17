import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSuccessDialogHotkeys } from "./hotkeys"
import { Icons } from "../icons"

interface SuccessDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddAnother: () => void
  onGoToComponent: () => void
  mode?: "component" | "demo"
}

export function SuccessDialog({
  isOpen,
  onOpenChange,
  onAddAnother,
  onGoToComponent,
  mode = "component",
}: SuccessDialogProps) {
  useSuccessDialogHotkeys({ isOpen, onAddAnother, onGoToComponent })

  const title =
    mode === "component"
      ? "Component Added Successfully"
      : "Demo Added Successfully"

  const description =
    mode === "component"
      ? "Your new component has been successfully added. What would you like to do next?"
      : "Your new demo has been successfully added. What would you like to do next?"

  const addAnotherText = mode === "component" ? "Add another" : "Add another"

  const viewText = mode === "component" ? "View Component" : "View Demo"

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="break-words">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onAddAnother} variant="outline">
            {addAnotherText}
            <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border px-1.5 ml-1.5 font-mono text-[11px] font-medium text-muted-foreground">
              N
            </kbd>
          </Button>
          <Button onClick={onGoToComponent} variant="default">
            {viewText}
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans  text-[11px] text-muted leading-none  opacity-100 flex">
              <span className="text-[11px] leading-none font-sans">
                {navigator?.platform?.toLowerCase()?.includes("mac")
                  ? "⌘"
                  : "Ctrl"}
              </span>
              <Icons.enter className="h-3 w-3" />
            </kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
