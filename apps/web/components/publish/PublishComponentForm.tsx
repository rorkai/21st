"use client"

import React, { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { uploadToR2 } from "../../utils/r2"
import {
  formSchema,
  FormData,
  isFormValid,
  prepareFilesForPublishPreview,
} from "./utils"
import {
  extractComponentNames,
  extractDependencies,
  extractDemoComponentNames,
  findInternalDependencies,
} from "../../utils/parsers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { addTagsToComponent } from "@/utils/dbQueries"
import { ComponentDetailsForm, ComponentDetailsFormRef } from "./ComponentDetailsForm"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { FileTerminal, SunMoon, Codepen } from "lucide-react"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { useUser } from "@clerk/nextjs"
import { useDebugMode } from "@/hooks/useDebugMode"
import { Tag } from "@/types/global"
import { PublishComponentPreview } from "./preview"
import { Hotkey } from "../ui/hotkey"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Code } from "@/components/ui/code"

interface ParsedCodeData {
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  internalDependencies: Record<string, string>
  componentNames: string[]
  demoComponentNames: string[]
}

export default function PublishComponentForm() {
  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const router = useRouter()
  const isDebug = useDebugMode()
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      component_slug: "",
      code: "",
      demo_code: "",
      description: "",
      tags: [],
      license: "mit",
    },
  })
  const {
    component_slug: componentSlug,
    code,
    demo_code: demoCode,
    tags: validTags,
  } = form.getValues()

  const [parsedCode, setParsedCode] = useState<ParsedCodeData>({
    dependencies: {},
    demoDependencies: {},
    internalDependencies: {},
    componentNames: [],
    demoComponentNames: [],
  })

  const [showDetailedForm, setShowDetailedForm] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const detailedFormRef = useRef<ComponentDetailsFormRef>(null)

  const [showDemoCodeInput, setShowDemoCodeInput] = useState(false)

  useEffect(() => {
    if (showDetailedForm && detailedFormRef.current) {
      detailedFormRef.current.focusNameInput()
    }
  }, [showDetailedForm])

  useEffect(() => {
    const updateDependencies = () => {
      try {
        const componentNames = extractComponentNames(code)
        const dependencies = extractDependencies(code)
        const demoDependencies = extractDependencies(demoCode)
        const demoComponentNames = extractDemoComponentNames(demoCode)
        const internalDependencies = findInternalDependencies(code, demoCode)

        setParsedCode({
          dependencies,
          demoDependencies,
          componentNames,
          demoComponentNames,
          internalDependencies,
        })
      } catch (error) {
        console.error("Error updating dependencies:", error)
      }
    }

    updateDependencies()
  }, [code, demoCode])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5 MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      form.setValue("preview_url", file)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!user || !user.id) {
      console.error("User is not authenticated")
      alert("You must be logged in to add a component.")
      return
    }

    if (
      Object.values(parsedCode.internalDependencies ?? {}).some((slug) => !slug)
    ) {
      console.error("Internal dependencies not specified")
      alert("Please specify the slug for all internal dependencies")
      return
    }

    setIsLoading(true)
    try {
      const codeFileName = `${data.component_slug}.tsx`
      const demoCodeFileName = `${data.component_slug}.demo.tsx`

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToR2({
          file: {
            name: codeFileName,
            type: "text/plain",
            textContent: data.code,
          },
          fileKey: `${user.id}/${codeFileName}`,
          bucketName: "components-code",
        }),
        uploadToR2({
          file: {
            name: demoCodeFileName,
            type: "text/plain",
            textContent: demoCode,
          },
          fileKey: `${user.id}/${demoCodeFileName}`,
          bucketName: "components-code",
        }),
      ])

      let previewImageUrl = ""
      if (data.preview_url) {
        const fileExtension = data.preview_url.name.split(".").pop()
        const fileKey = `${user.id}/${componentSlug}.${fileExtension}`
        const buffer = Buffer.from(await data.preview_url.arrayBuffer())
        const base64Content = buffer.toString("base64")
        previewImageUrl = await uploadToR2({
          file: {
            name: fileKey,
            type: data.preview_url.type,
            encodedContent: base64Content,
          },
          fileKey,
          bucketName: "components-code",
          contentType: data.preview_url.type,
        })
      }

      const componentData = {
        name: data.name,
        component_names: parsedCode.componentNames,
        demo_component_names: parsedCode.demoComponentNames,
        component_slug: data.component_slug,
        code: codeUrl,
        demo_code: demoCodeUrl,
        description: data.description,
        user_id: user?.id,
        dependencies: parsedCode.dependencies,
        demo_dependencies: parsedCode.demoDependencies,
        internal_dependencies: parsedCode.internalDependencies,
        preview_url: previewImageUrl,
      }

      const { data: insertedComponent, error } = await client
        .from("components")
        .insert(componentData)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (validTags) {
        await addTagsToComponent(
          client,
          insertedComponent.id,
          validTags.filter((tag) => !!tag.slug) as Tag[],
        )
      }

      if (insertedComponent) {
        setIsSuccessDialogOpen(true)
      }
    } catch (error) {
      console.error("Error adding component:", error)
      let errorMessage = "An error occurred while adding the component"
      if (error instanceof Error) {
        errorMessage += ": " + error.message
      }
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToComponent = () => {
    if (user) {
      router.push(`/${user.username}/${componentSlug}`)
    }
    setIsSuccessDialogOpen(false)
  }

  const handleAddAnother = () => {
    form.reset()
    setIsSuccessDialogOpen(false)
    setShowDetailedForm(false)
    setPreviewImage(null)
  }

  const [previewProps, setPreviewProps] = useState<{
    files: Record<string, string>
    dependencies: Record<string, string>
  } | null>(null)

  useEffect(() => {
    if (
      code &&
      demoCode &&
      Object.keys(parsedCode.internalDependencies ?? {}).length === 0
    ) {
      const { files, dependencies } = prepareFilesForPublishPreview(
        code,
        demoCode,
        user!.username!,
        isDarkTheme,
      )
      setPreviewProps({ files, dependencies })
    } else {
      setPreviewProps(null)
    }
  }, [code, demoCode, parsedCode.internalDependencies])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    onSubmit(formData)
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      const formData = form.getValues()
      const isFormComplete = formData.name && formData.preview_url
      if (isFormComplete) {
        if (e.code === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          handleSubmit(e as unknown as React.FormEvent)
        }
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [form, parsedCode.internalDependencies, handleSubmit, onSubmit])

  const isPreviewReady =
    !!previewProps &&
    Object.keys(parsedCode.internalDependencies).length === 0 &&
    !!code.length &&
    !!demoCode.length

  const getMainComponentName = () => {
    if (!parsedCode.componentNames || parsedCode.componentNames.length === 0)
      return null

    const capitalizedComponent = parsedCode.componentNames.find((name) =>
      /^[A-Z]/.test(name),
    )
    if (!capitalizedComponent) return null

    return capitalizedComponent.replace(/([A-Z])/g, " $1").trim()
  }

  const mainComponentName = getMainComponentName()

  const demoCodeTextAreaRef = useRef<HTMLTextAreaElement>(null)
  const codeInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!showDetailedForm && codeInputRef.current) {
      codeInputRef.current?.focus?.()
    } else if (showDetailedForm && demoCodeTextAreaRef.current) {
      setTimeout(() => {
        demoCodeTextAreaRef.current?.focus()
      }, 0)
    }
  }, [showDetailedForm])

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex w-full h-full items-center justify-center"
        >
          <AnimatePresence>
            <div className={`flex gap-4 items-center h-full w-full mt-2`}>
              <div
                className={cn(
                  "flex flex-col scrollbar-hide items-start gap-2 py-10 max-h-[calc(100vh-40px)] px-[2px] overflow-y-auto w-1/3 min-w-[400px] ml-0",
                )}
              >
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="w-full relative">
                      <FormControl>
                        <motion.div
                          className="relative"
                          animate={{
                            height: showDemoCodeInput ? "56px" : "70vh",
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {!showDemoCodeInput && <Label>Component code</Label>}
                          <Textarea
                            ref={codeInputRef}
                            placeholder="Paste code of your component here"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value)
                              if (e.target.value.trim()) {
                                setIsEditMode(false)
                              }
                            }}
                            className={cn(
                              "mt-1 min-h-[56px] w-full h-full resize-none scrollbar-hide",
                            )}
                          />

                          {!!showDemoCodeInput && !isEditMode && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className={`absolute p-2 border rounded-md inset-0 bg-background text-foreground bg-opacity-80 backdrop-blur-sm flex items-center justify-start`}
                            >
                              <EditCodeFileCard
                                iconSrc={
                                  isDarkTheme
                                    ? "/tsx-file-dark.svg"
                                    : "/tsx-file.svg"
                                }
                                mainText={`${mainComponentName} code`}
                                subText={`${parsedCode.componentNames.slice(0, 2).join(", ")}${parsedCode.componentNames.length > 2 ? ` +${parsedCode.componentNames.length - 2}` : ""}`}
                                onEditClick={() => {
                                  setShowDemoCodeInput(false)
                                  setShowDetailedForm(false)
                                  codeInputRef.current?.focus()
                                }}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!showDemoCodeInput && (
                  <div className="-mt-5 h-[36px] flex justify-end w-full">
                    <AnimatePresence>
                      {!!parsedCode.componentNames?.length &&
                        !showDemoCodeInput && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mr-2"
                          >
                            <Button onClick={() => setShowDemoCodeInput(true)}>
                              Continue
                            </Button>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                )}

                {showDemoCodeInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="w-full"
                  >
                    <FormField
                      control={form.control}
                      name="demo_code"
                      render={({ field }) => (
                        <FormItem className="w-full relative">
                          {!showDetailedForm && <Label>Demo code</Label>}
                          <FormControl>
                            <motion.div
                              className="relative"
                              animate={{
                                height: showDetailedForm
                                  ? "56px"
                                  : "calc(100vh/3)",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Textarea
                                placeholder="Paste code that demonstrates usage of the component with all variants"
                                ref={demoCodeTextAreaRef}
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.value)
                                }}
                                className="mt-1 w-full h-full resize-none"
                                style={{ height: "100%", minHeight: "100%" }}
                              />
                              {showDetailedForm && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.3, delay: 0.3 }}
                                  className="absolute p-2 border rounded-md inset-0 bg-background text-foreground bg-opacity-80 backdrop-blur-sm flex items-center justify-start"
                                >
                                  <EditCodeFileCard
                                    iconSrc={
                                      isDarkTheme
                                        ? "/demo-file-dark.svg"
                                        : "/demo-file.svg"
                                    }
                                    mainText="Demo code"
                                    subText={`for ${parsedCode.componentNames[0]}`}
                                    onEditClick={() => {
                                      setShowDetailedForm(false)
                                      setTimeout(() => {
                                        demoCodeTextAreaRef.current?.focus()
                                      }, 0)
                                    }}
                                  />
                                </motion.div>
                              )}
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="-mt-10 h-[36px] flex justify-end w-full">
                      <AnimatePresence>
                        {!!parsedCode.demoComponentNames &&
                          !showDetailedForm && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mr-2"
                            >
                              <Button onClick={() => setShowDetailedForm(true)}>
                                Continue
                              </Button>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {Object.keys(parsedCode.internalDependencies).length > 0 &&
                  showDetailedForm && (
                    <InputInternalDependenciesCard
                      internalDependencies={parsedCode.internalDependencies}
                      setComponentDependencies={setParsedCode}
                    />
                  )}

                {isDebug && (
                  <DebugInfoDisplay
                    componentNames={parsedCode.componentNames}
                    demoComponentNames={parsedCode.demoComponentNames}
                    dependencies={parsedCode.dependencies}
                    demoDependencies={parsedCode.demoDependencies}
                    internalDependencies={parsedCode.internalDependencies}
                  />
                )}

                {showDetailedForm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="w-full"
                  >
                    <ComponentDetailsForm
                      ref={detailedFormRef}
                      form={form}
                      previewImage={previewImage}
                      handleFileChange={handleFileChange}
                      handleSubmit={handleSubmit}
                      isLoading={isLoading}
                      isFormValid={isFormValid}
                      internalDependencies={
                        parsedCode.internalDependencies ?? {}
                      }
                      componentName={mainComponentName}
                    />
                  </motion.div>
                )}
              </div>

              {previewProps && isPreviewReady && showDetailedForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 3 }}
                  className="w-2/3 py-4"
                >
                  <React.Suspense fallback={<div>Loading preview...</div>}>
                    <PublishComponentPreview
                      {...previewProps}
                      isDebug={isDebug}
                    />
                  </React.Suspense>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </form>
      </Form>
      <SuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onAddAnother={handleAddAnother}
        onGoToComponent={handleGoToComponent}
      />
      {!showDemoCodeInput && !isPreviewReady && !isEditMode && (
        <CodeGuidelinesAlert />
      )}
      {showDemoCodeInput && !showDetailedForm && (
        <DemoComponentGuidelinesAlert publisherUsername={user?.username!} />
      )}
    </>
  )
}

const EditCodeFileCard = ({
  iconSrc,
  mainText,
  subText,
  onEditClick,
}: {
  iconSrc: string
  mainText: string
  subText: string
  onEditClick: () => void
}) => (
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
          <p className="text-sm text-gray-600 text-[12px]">{subText}</p>
        </div>
      </div>
      <Button onClick={onEditClick}>Edit</Button>
    </div>
  </div>
)

const SuccessDialog = ({
  isOpen,
  onOpenChange,
  onAddAnother,
  onGoToComponent,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddAnother: () => void
  onGoToComponent: () => void
}) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (isOpen && e.code === "KeyN") {
        e.preventDefault()
        onAddAnother()
      }
      if (isOpen && e.code === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onGoToComponent()
      }
    }

    window.addEventListener("keydown", keyDownHandler)
    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [isOpen, onAddAnother, onGoToComponent])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Component Added Successfully</DialogTitle>
          <DialogDescription className="break-words">
            Your new component has been successfully added. What would you like
            to do next?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onAddAnother} variant="outline">
            Add Another
            <Hotkey keys={["N"]} />
          </Button>
          <Button onClick={onGoToComponent} variant="default">
            View Component
            <Hotkey keys={["⏎"]} modifier={true} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CodeGuidelinesAlert = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex justify-end items-center p-10 overflow-auto -z-10"
    >
      <div className="w-1/2 min-w-[400px]">
        <Alert className="border-none">
          <FileTerminal className="h-4 w-4" />
          <AlertTitle>Component code requirements</AlertTitle>
          <AlertDescription className="mt-2">
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Using dependencies:
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    You can use any dependencies from npm; we import them
                    automatically.
                  </li>
                  <li>
                    To import existing components from our registry, paste a
                    direct link to the component.
                  </li>
                </ul>
              </li>
              <li>
                React, TypeScript & Tailwind compatibility:
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    React client-side components are fully supported. Be sure to
                    import React:
                  </li>
                  <Code
                    display="block"
                    code={'"use client" \n\nimport React from "react"'}
                  />
                  <li>TypeScript is fully supported.</li>
                  <li>
                    Tailwind is fully supported along with custom Tailwind
                    styles from shadcn/ui.
                  </li>
                </ul>
              </li>
              <li>
                Next.js & server components compatibility:
                <ul className="list-disc pl-5 mt-1">
                  <li>Next.js is partially supported.</li>
                  <li>React server components are not supported yet.</li>
                  <li>
                    While we emulate browser-side Next.js functions, we do not
                    support Next.js completely. Make sure your code works in our
                    environment; if it doesn't, contact @serafimcloud on X
                  </li>
                </ul>
              </li>
              <li>
                Tailwind CSS:
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    Custom Tailwind styles are not yet supported in the preview.
                  </li>
                  <li>
                    If your component needs additional styles, specify them in
                    the description so users can install them themselves.
                  </li>
                </ul>
              </li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    </motion.div>
  )
}

const DemoComponentGuidelinesAlert = ({
  publisherUsername,
}: {
  publisherUsername: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3, delay: 0.3 }}
    className="fixed inset-0 flex justify-end items-center p-4 overflow-auto -z-10"
  >
    <div className="w-1/2 min-w-[400px]">
      <Alert className="border-none">
        <SunMoon className="h-4 w-4" />
        <AlertTitle>Demo code requirements</AlertTitle>
        <AlertDescription className="mt-2">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Component imports:
              <ul className="list-disc pl-5 mt-1">
                <li>
                  Import your component with curly braces from {" "}
                  <Code code="@/components" /> path:
                  <Code
                    display="block"
                    code={`import { MyComponent } from "@/components/${publisherUsername}/my-component"`}
                  />
                </li>
                <li>
                  Import external existing components from our registry via <Code code="@/components/<author>/<component-name>" /> paths:
                  <Code
                    display="block"
                    code={`import { OtherComponent } from "@/components/${publisherUsername}/other-component"`}
                  />
                </li>
              </ul>
            </li>
            <li>
              Demo structure:
              <ul className="list-disc pl-5 mt-1">
                <li>
                  The demo code should demonstrate the usage and appearance of
                  the component.
                </li>
                <li>
                  You can create multiple component demo variants. Export all
                  demo variants you want to display on the page using curly
                  braces:
                  <Code display="block" code={"export { DemoVariant1, DemoVariant2 }"} />
                </li>
              </ul>
            </li>
            <li>
              Imports and dependencies:
              <ul className="list-disc pl-5 mt-1">
                <li>
                  You can use any dependencies from npm; we install them
                  automatically.
                </li>
                <li>
                  Be sure to import React if you use it in the demo code:
                  <Code display="block" code={'import React from "react"'} />
                </li>
              </ul>
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  </motion.div>
)

const DebugInfoDisplay = ({
  componentNames,
  demoComponentNames,
  dependencies,
  demoDependencies,
}: ParsedCodeData) => (
  <>
    <div className="w-full">
      <Label>Component names</Label>
      <Textarea
        value={componentNames?.join(", ")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
    <div className="w-full">
      <Label>Demo component name</Label>
      <Input
        value={demoComponentNames?.join(", ")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
    <div className="w-full">
      <Label>Component dependencies</Label>
      <Textarea
        value={Object.entries(dependencies ?? {})
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
    <div className="w-full">
      <Label>Demo dependencies</Label>
      <Textarea
        value={Object.entries(demoDependencies ?? {})
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
        readOnly
        className="mt-1 w-full bg-gray-100"
      />
    </div>
  </>
)

const InputInternalDependenciesCard = ({
  internalDependencies,
  setComponentDependencies,
}: {
  internalDependencies: Record<string, string>
  setComponentDependencies: React.Dispatch<React.SetStateAction<ParsedCodeData>>
}) => (
  <div className="w-full">
    <Alert className="my-2">
      <Codepen className="h-4 w-4" />
      <AlertTitle>Component dependencies detected</AlertTitle>
      <AlertDescription>
        To use another component within your component:
        <br />
        1. Add it to the 21st Registry first.
        <br />
        2. Paste the link here.
      </AlertDescription>
    </Alert>
    {Object.entries(internalDependencies).map(([path], index) => (
      <div key={path} className={`w-full ${index > 0 ? "mt-2" : ""}`}>
        <Label className="text-sm">Paste the link to {path}</Label>
        <Input
          onChange={(e) => {
            setComponentDependencies((prev) => ({
              ...prev,
              internalDependencies: {
                ...prev?.internalDependencies,
                [path]: e.target.value!!,
              },
            }))
          }}
          placeholder='e.g. "shadcn/button"'
          className="mt-1 w-full"
        />
      </div>
    ))}
  </div>
)
