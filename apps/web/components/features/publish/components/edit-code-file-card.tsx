import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditCodeFileCardProps {
  iconSrc: string
  mainText: string
  subText?: string
  onEditClick: () => void
  className?: string
}

export function EditCodeFileCard({
  iconSrc,
  mainText,
  subText,
  onEditClick,
  className,
}: EditCodeFileCardProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-2 pr-24",
        "border rounded-lg bg-card hover:bg-accent/5",
        "transition-all duration-200 ease-in-out",
        "hover:shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-border/80",
        className,
      )}
    >
      <div className="relative flex items-center justify-center w-10 h-10 rounded-md bg-accent/10 ring-1 ring-accent/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/10 to-transparent" />
        <Image
          src={iconSrc}
          width={36}
          height={36}
          alt={`${mainText} File`}
          className="relative shrink-0 transition-transform duration-200 group-hover:scale-110 drop-shadow-sm"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate text-foreground">
          {mainText}
        </p>
        {subText && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {subText}
          </p>
        )}
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <Button
          variant="ghost"
          onClick={onEditClick}
          className="h-8 px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Edit
        </Button>
      </div>
    </div>
  )
}
