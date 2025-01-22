import { useRef, useState, useEffect } from "react"

export function useImageUpload() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Cleanup object URL when component unmounts
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleThumbnailClick = () => {
    fileInputRef.current?.click()
  }

  const processFile = async (file: File): Promise<string | undefined> => {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    try {
      // Clean up previous object URL if exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }

      // Convert to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)

      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64String = reader.result as string
          setPreviewUrl(base64String) // Use base64 for preview
          resolve(base64String)
        }
        reader.onerror = reject
      })
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Failed to process image")
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    return processFile(file)
  }

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current += 1
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const file = event.dataTransfer.files?.[0]
    if (!file) return
    return processFile(file)
  }

  return {
    previewUrl,
    isDragging,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  }
}
