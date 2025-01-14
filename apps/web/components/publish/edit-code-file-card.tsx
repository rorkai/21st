import Image from "next/image"
import { Button } from "@/components/ui/button"

interface EditCodeFileCardProps {
  iconSrc: string
  mainText: string
  subText: string
  onEditClick: () => void
}

export function EditCodeFileCard({
  iconSrc,
  mainText,
  subText,
  onEditClick,
}: EditCodeFileCardProps) {
  return (
    <div className="p-2 border rounded-md bg-background text-foreground bg-opacity-80 backdrop-blur-sm flex items-center justify-start">
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="w-10 h-10 relative mr-2 items-center justify-center">
              <Image
                src={iconSrc}
                width={40}
                height={40}
                alt={`${mainText} File`}
              />
            </div>
            <div className="flex flex-col items-start h-10">
              <p className="font-semibold text-[14px]">{mainText}</p>
              <p className="text-sm text-muted-foreground text-[12px]">
                {subText}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onEditClick}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}
