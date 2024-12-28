import { useTheme } from "next-themes"
import Image from "next/image"

import { cn } from "@/lib/utils"

interface UploadIconProps {
  className?: string
}

const UploadIcon: React.FC<UploadIconProps> = ({ className }) => {
  const { resolvedTheme } = useTheme()

  return (
    <div className="w-full flex justify-center">
      <Image
        src={
          resolvedTheme === "dark"
            ? "/upload-icon-dark.png"
            : "/upload-icon.png"
        }
        alt="Upload Icon"
        width={40}
        height={40}
        className={cn(className)}
      />
    </div>
  )
}

export default UploadIcon
