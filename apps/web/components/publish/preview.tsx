import { useEffect, useState } from "react"
import { SandpackProvider, SandpackFileExplorer, SandpackCodeViewer } from "@codesandbox/sandpack-react/unstyled"
import React from "react"

const SandpackPreview = React.lazy(() =>
  import("@codesandbox/sandpack-react/unstyled").then((module) => ({
    default: module.SandpackPreview,
  })),
)

export function PublishComponentPreview({
  files,
  dependencies,
  isDebug,
}: {
  files: Record<string, string>
  dependencies: Record<string, string>
  isDebug: boolean
}) {
  const [isComponentsLoaded, setIsComponentsLoaded] = useState(false)

  useEffect(() => {
    const loadComponents = async () => {
      await import("@codesandbox/sandpack-react/unstyled")
      setIsComponentsLoaded(true)
    }
    loadComponents()
  }, [])

  if (!isComponentsLoaded) {
    return <div>Loading preview...</div>
  }

  const providerProps = {
    template: "react-ts" as const,
    files,
    customSetup: {
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        ...dependencies,
      },
    },
    options: {
      externalResources: [
        "https://cdn.tailwindcss.com",
        "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/css/combined-tailwind.css",
      ],
    },
  }

  return (
    <div className="w-full bg-[#FAFAFA] rounded-lg">
      <SandpackProvider {...providerProps}>
        <SandpackPreview />
        {isDebug && (
          <>
            <SandpackFileExplorer />
            <SandpackCodeViewer />
          </>
        )}
      </SandpackProvider>
    </div>
  )
}
