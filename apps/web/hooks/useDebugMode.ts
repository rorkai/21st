import { useEffect } from "react"
import { useAtom, atom } from "jotai"

const isDebugAtom = atom(false)

export function useDebugMode() {
  const [isDebug, setIsDebug] = useAtom(isDebugAtom)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault()
        setIsDebug((prevState: boolean) => !prevState)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [setIsDebug])

  return isDebug
}
