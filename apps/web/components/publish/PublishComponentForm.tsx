"use client"

import React, { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { uploadToR2 } from "../../utils/r2"
import { formSchema, FormData } from "./utils"
import {
  extractComponentNames,
  extractNPMDependencies,
  extractDemoComponentNames,
  extractRegistryDependenciesFromImports as extractExactRegistryDependenciesImports,
  extractAmbigiousRegistryDependencies,
} from "../../utils/parsers"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import {
  ComponentDetailsForm,
  ComponentDetailsFormRef,
} from "./ComponentDetailsForm"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { useUser } from "@clerk/nextjs"
import { useDebugMode } from "@/hooks/useDebugMode"
import { Tag } from "@/types/global"
import { PublishComponentPreview } from "./preview"
import { Hotkey } from "../ui/hotkey"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  CodeGuidelinesAlert,
  DebugInfoDisplay,
  DemoComponentGuidelinesAlert,
  ResolveUnknownDependenciesCard,
} from "./info-cards"
import { makeSlugFromName } from "./useIsCheckSlugAvailable"
import { Tables } from "@/types/supabase"

export interface ParsedCodeData {
  dependencies: Record<string, string>
  demoDependencies: Record<string, string>
  directRegistryDependencies: string[]
  unknownDependencies: string[]
  componentNames: string[]
  demoComponentNames: string[]
}

export default function PublishComponentForm() {
  const registryToPublish = "ui"
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
    directRegistryDependencies: [],
    unknownDependencies: [],
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
    const parseDependenciesFromCode = () => {
      try {
        const componentNames = extractComponentNames(code)
        const possibleComponentSlugs = componentNames.map((name) =>
          makeSlugFromName(name),
        )
        if (possibleComponentSlugs.length > 0) {
          form.setValue("component_slug", possibleComponentSlugs[0] ?? "")
        }
        const dependencies = extractNPMDependencies(code)
        const demoDependencies = extractNPMDependencies(demoCode)
        const demoComponentNames = extractDemoComponentNames(demoCode)
        const directRegistryDependencies =
          extractExactRegistryDependenciesImports(code)
        const ambigiousRegistryDependencies = {
          ...extractAmbigiousRegistryDependencies(code, registryToPublish),
          ...extractAmbigiousRegistryDependencies(demoCode, registryToPublish),
        }
        console.log(
          "ambigiousRegistryDependencies",
          ambigiousRegistryDependencies,
        )
        console.log("possibleComponentSlugs", possibleComponentSlugs)
        const unknownDependencies = Object.values(
          ambigiousRegistryDependencies,
        ).filter((dependency) => !possibleComponentSlugs.includes(dependency))
        console.log("unknownDependencies", unknownDependencies)

        setParsedCode({
          dependencies,
          demoDependencies,
          componentNames,
          demoComponentNames,
          unknownDependencies,
          directRegistryDependencies,
        })
      } catch (error) {
        console.error("Error parsing dependencies from code:", error)
      }
    }

    parseDependenciesFromCode()
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
    if (parsedCode.unknownDependencies.length > 0) {
      console.error("Unknown dependencies found, can't publish")
      alert("Please specify the registry slugs for all unknown dependencies")
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
          fileKey: `${user?.id!}/${codeFileName}`,
          bucketName: "components-code",
        }),
        uploadToR2({
          file: {
            name: demoCodeFileName,
            type: "text/plain",
            textContent: demoCode,
          },
          fileKey: `${user?.id!}/${demoCodeFileName}`,
          bucketName: "components-code",
        }),
      ])

      let previewImageUrl = ""
      if (data.preview_url) {
        const fileExtension = data.preview_url.name.split(".").pop()
        const fileKey = `${user?.id!}/${componentSlug}.${fileExtension}`
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
        description: data.description ?? null,
        user_id: user?.id!,
        dependencies: parsedCode.dependencies,
        demo_dependencies: parsedCode.demoDependencies,
        direct_registry_dependencies: parsedCode.directRegistryDependencies,
        preview_url: previewImageUrl,
      } as Tables<"components">

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
  }, [form, handleSubmit, onSubmit])

  const isPreviewReady =
    parsedCode.unknownDependencies.length === 0 &&
    !!code.length &&
    !!demoCode.length

  console.log(
    "isPreviewReady",
    isPreviewReady,
    parsedCode.unknownDependencies,
    code,
    demoCode,
  )

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
                            <Button
                              size="sm"
                              onClick={() => setShowDemoCodeInput(true)}
                            >
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
                                    subText={`for ${parsedCode.componentNames.join(", ")}`}
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
                              <Button
                                size="sm"
                                onClick={() => setShowDetailedForm(true)}
                              >
                                Continue
                              </Button>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {parsedCode.unknownDependencies.length > 0 &&
                  showDetailedForm && (
                    <ResolveUnknownDependenciesCard
                      unknownDependencies={parsedCode.unknownDependencies}
                      onDependencyResolved={(username, slug) => {
                        setParsedCode((prev) => ({
                          ...prev,
                          unknownDependencies: prev.unknownDependencies.filter(
                            (dependency) => dependency !== slug,
                          ),
                          directRegistryDependencies: [
                            ...prev.directRegistryDependencies,
                            `${username}/${slug}`,
                          ],
                        }))
                      }}
                    />
                  )}

                {isDebug && (
                  <DebugInfoDisplay
                    componentNames={parsedCode.componentNames}
                    demoComponentNames={parsedCode.demoComponentNames}
                    dependencies={parsedCode.dependencies}
                    demoDependencies={parsedCode.demoDependencies}
                    directRegistryDependencies={
                      parsedCode.directRegistryDependencies
                    }
                    unknownDependencies={parsedCode.unknownDependencies}
                  />
                )}

                {showDetailedForm &&
                  parsedCode.unknownDependencies.length === 0 && (
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
                        componentName={mainComponentName}
                        unknownDependencies={parsedCode.unknownDependencies}
                      />
                    </motion.div>
                  )}
              </div>

              {isPreviewReady && showDetailedForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 3 }}
                  className="w-2/3 py-4"
                >
                  <React.Suspense fallback={<div>Loading preview...</div>}>
                    <PublishComponentPreview
                      code={code}
                      demoCode={demoCode}
                      slugToPublish={componentSlug}
                      registryToPublish={registryToPublish}
                      directRegistryDependencies={
                        parsedCode.directRegistryDependencies
                      }
                      isDarkTheme={isDarkTheme}
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
        <DemoComponentGuidelinesAlert
          mainComponentName={mainComponentName}
          possibleComponentSlug={makeSlugFromName(
            mainComponentName ?? "MyComponent",
          )}
        />
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
      <Button size="sm" onClick={onEditClick}>
        Edit
      </Button>
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
