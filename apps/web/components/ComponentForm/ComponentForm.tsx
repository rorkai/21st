"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { uploadToR2, uploadPreviewImageToR2, handleFileChange } from "./actions"
import {
  formSchema,
  FormData,
  isFormValid,
  prepareFilesForPreview,
} from "./utils"
import {
  extractComponentNames,
  extractDependencies,
  extractDemoComponentName,
  findInternalDependencies,
  removeComponentImports,
  wrapExportInBraces,
  removeAsyncFromExport,
} from "../../utils/parsers"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/themes/prism.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { addComponent, addTagsToComponent } from "@/utils/dataFetchers"

import { ComponentDetails } from "./ComponentDetails"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { FileTerminal, SunMoon, Codepen } from "lucide-react"
import { useClerkSupabaseClient } from "@/utils/clerk"
import { useUser } from "@clerk/nextjs"
import { useDebugMode } from "@/hooks/useDebugMode"
import { Tag } from "@/types/types"
import { Preview } from "./preview"
import { Hotkey } from "../ui/hotkey"
import { useTheme } from "next-themes"

export default function ComponentForm() {
  const { theme } = useTheme()
  const isDarkTheme = theme === 'dark'

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

  const isDebug = useDebugMode()
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [componentDependencies, setComponentDependencies] = useState<{
    dependencies: Record<string, string>
    demoDependencies: Record<string, string>
    internalDependencies: Record<string, string>
    componentNames: string[]
    demoComponentName: string
  }>({
    dependencies: {},
    demoDependencies: {},
    internalDependencies: {},
    componentNames: [],
    demoComponentName: "",
  })

  const {
    dependencies: parsedDependencies,
    demoDependencies: parsedDemoDependencies,
    internalDependencies: internalDependencies,
    componentNames: parsedComponentNames,
    demoComponentName: parsedDemoComponentName,
  } = componentDependencies || {}

  const {
    component_slug: componentSlug,
    code,
    demo_code: demoCode,
    tags: validTags,
  } = form.getValues()

  const { user } = useUser()
  const client = useClerkSupabaseClient()
  const router = useRouter()
  const [showComponentDetails, setShowComponentDetails] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importsToRemove, setImportsToRemove] = useState<string[] | undefined>(
    undefined,
  )

  useEffect(() => {
    const updateDependencies = () => {
      try {
        const componentNames = extractComponentNames(code)
        const dependencies = extractDependencies(code)
        const demoDependencies = extractDependencies(demoCode)
        const demoComponentName = extractDemoComponentName(demoCode)
        const internalDependencies = findInternalDependencies(code, demoCode)

        setComponentDependencies({
          dependencies,
          demoDependencies,
          componentNames,
          demoComponentName,
          internalDependencies,
        })
      } catch (error) {
        console.error("Error updating dependencies:", error)
      }
    }

    updateDependencies()
  }, [code, demoCode])

  const handleFileChangeWrapper = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    handleFileChange(event, setPreviewImage, form)
  }

  const onSubmit = async (data: FormData) => {
    if (!user || !user.id) {
      console.error("User is not authenticated")
      alert("You must be logged in to add a component.")
      return
    }

    if (Object.values(internalDependencies ?? {}).some((slug) => !slug)) {
      console.error("Internal dependencies not specified")
      alert("Please specify the slug for all internal dependencies")
      return
    }

    setIsLoading(true)
    try {
      const componentNames = parsedComponentNames
      const demoComponentName = parsedDemoComponentName
      const dependencies = parsedDependencies

      const cleanedDemoCode = demoCode

      const codeFileName = `${data.component_slug}-code.tsx`
      const demoCodeFileName = `${data.component_slug}-demo.tsx`

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToR2(codeFileName, data.code),
        uploadToR2(demoCodeFileName, cleanedDemoCode),
      ])

      const installUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/r/${data.component_slug}`

      let previewImageUrl = ""
      if (data.preview_url) {
        previewImageUrl = await uploadPreviewImageToR2(
          data.preview_url,
          data.component_slug,
        )
      }

      const componentData = {
        name: data.name,
        component_name: JSON.stringify(componentNames),
        demo_component_name: demoComponentName,
        component_slug: data.component_slug,
        code: codeUrl,
        demo_code: demoCodeUrl,
        description: data.description,
        install_url: installUrl,
        user_id: user?.id,
        dependencies: JSON.stringify(dependencies),
        demo_dependencies: JSON.stringify(parsedDemoDependencies),
        internal_dependencies: JSON.stringify(internalDependencies),
        preview_url: previewImageUrl,
      }

      const insertedData = await addComponent(client, componentData)

      if (insertedData && validTags) {
        await addTagsToComponent(
          client,
          insertedData.id,
          validTags.filter((tag) => !!tag.slug) as Tag[],
        )
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

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (
        isSuccessDialogOpen &&
        e.key === "Enter" &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault()
        handleGoToComponent()
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [isSuccessDialogOpen, handleGoToComponent])

  const handleAddAnother = () => {
    form.reset()
    setIsSuccessDialogOpen(false)
    setShowComponentDetails(false)
    setPreviewImage(null)
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (isSuccessDialogOpen && e.code === "KeyN") {
        e.preventDefault()
        handleAddAnother()
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [isSuccessDialogOpen, handleGoToComponent])

  const [previewProps, setPreviewProps] = useState<{
    files: Record<string, string>
    dependencies: Record<string, string>
  } | null>(null)

  useEffect(() => {
    if (
      code &&
      demoCode &&
      Object.keys(internalDependencies ?? {}).length === 0 &&
      importsToRemove?.length === 0
    ) {
      const { files, dependencies } = prepareFilesForPreview(
        code,
        demoCode,
        isDarkTheme,
      )
      setPreviewProps({ files, dependencies })
    } else {
      setPreviewProps(null)
    }
  }, [code, demoCode, internalDependencies, importsToRemove])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = form.getValues()
    onSubmit(formData)
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit(e as unknown as React.FormEvent)
      }
    }

    window.addEventListener("keydown", keyDownHandler)

    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [form, internalDependencies, handleSubmit, onSubmit])

  const isPreviewReady =
    !!previewProps &&
    Object.keys(internalDependencies).length === 0 &&
    importsToRemove !== undefined &&
    !!code.length &&
    !!demoCode.length

  const [exportWrapped, setExportWrapped] = useState(false)

  useEffect(() => {
    if (exportWrapped) return

    const code = form.getValues("code")
    console.log("code in useEffect wrapExportInBraces", code)
    if (!code) return

    const modifiedCode = wrapExportInBraces(code)

    if (modifiedCode !== code) {
      form.setValue("code", modifiedCode)
      console.log("modifiedCode in useEffect wrapExportInBraces", modifiedCode)
      setExportWrapped(true)
    } else {
      setExportWrapped(true)
    }
  }, [form.watch("code"), exportWrapped])

  useEffect(() => {
    const demoCode = form.getValues("demo_code")
    if (!demoCode) return

    console.log("Original demo code:", demoCode)

    const modifiedDemoCode = removeAsyncFromExport(demoCode)

    if (modifiedDemoCode !== demoCode) {
      form.setValue("demo_code", modifiedDemoCode)
      console.log("Async removed from export. New demo code:", modifiedDemoCode)
    } else {
      console.log("No async exports found or no changes made.")
    }
  }, [form.watch("demo_code")])

  useEffect(() => {
    if (!parsedComponentNames) return
    const demoCode = form.getValues("demo_code")
    const { modifiedCode, removedImports } = removeComponentImports(
      demoCode,
      parsedComponentNames,
    )
    setImportsToRemove(removedImports)
    const demoComponentName = extractDemoComponentName(modifiedCode)
    if (demoComponentName) {
      setShowComponentDetails(true)
      form.setValue("demo_code", modifiedCode)
    }
  }, [form.watch("demo_code")])

  const getMainComponentName = () => {
    if (!parsedComponentNames || parsedComponentNames.length === 0) return null

    const capitalizedComponent = parsedComponentNames.find((name) =>
      /^[A-Z]/.test(name),
    )
    if (!capitalizedComponent) return null

    return capitalizedComponent.replace(/([A-Z])/g, " $1").trim()
  }

  const mainComponentName = getMainComponentName()

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
                className={`flex flex-col items-start gap-2 py-10 max-h-[calc(100vh-40px)] px-[2px] overflow-y-auto w-1/3 min-w-[400px] ${showComponentDetails && Object.keys(internalDependencies).length === 0 ? "ml-0" : "mx-auto"}`}
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
                            height: isEditMode
                              ? "33vh"
                              : parsedComponentNames?.length
                                ? "64px"
                                : "50px",
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {!parsedComponentNames?.length &&
                            !isPreviewReady &&
                            !isEditMode && (
                              <div
                                className={`absolute inset-0 w-full h-full ${isDarkTheme ? "text-gray-400" : "text-gray-600"} text-[20px] flex items-center justify-center`}
                              >
                                PASTE COMPONENT .TSX CODE HERE
                              </div>
                            )}

                          <Editor
                            value={field.value}
                            onValueChange={(code) => {
                              field.onChange(code)
                              if (code.trim()) {
                                setIsEditMode(false)
                              }
                            }}
                            highlight={(code) => {
                              const grammar =
                                languages.tsx || languages.typescript
                              return grammar
                                ? highlight(code, grammar, "tsx")
                                : code
                            }}
                            padding={10}
                            style={{
                              fontFamily: '"Fira code", "Fira Mono", monospace',
                              fontSize: code.length ? 12 : 20,
                              backgroundColor: code.length
                                ? isDarkTheme
                                  ? "#2d2d2d"
                                  : "#f5f5f5"
                                : "transparent",
                              borderRadius: "0.375rem",
                              height: "100%",
                              overflow: "auto",
                              outline: "black !important",
                              color: isDarkTheme ? "#e0e0e0" : "inherit",
                            }}
                            className={`mt-1 w-full ${isDarkTheme ? "border-gray-700" : "border-input"} ${code.length ? "border" : ""}`}
                          />
                          {!!parsedComponentNames?.length && !isEditMode && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className={`absolute p-2 border rounded-md inset-0 bg-background text-foreground bg-opacity-80 backdrop-blur-sm flex items-center justify-start`}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 relative mr-2 items-center justify-center">
                                      <Image
                                        src="/tsx-file.svg"
                                        width={40}
                                        height={40}
                                        alt="TSX File"
                                      />
                                    </div>
                                    <div className="flex flex-col items-start">
                                      <p className="font-semibold text-[14px]">
                                        {mainComponentName} code
                                      </p>
                                      <p className="text-sm text-gray-600 text-[12px]">
                                        {parsedComponentNames
                                          .slice(0, 2)
                                          .join(", ")}
                                        {parsedComponentNames.length > 2 &&
                                          ` +${parsedComponentNames.length - 2}`}
                                      </p>
                                    </div>
                                  </div>
                                  <Button onClick={() => setIsEditMode(true)}>
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!!parsedComponentNames?.length && (
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
                          {!showComponentDetails && (
                            <FormLabel>PASTE DEMO CODE HERE [⌘ V]</FormLabel>
                          )}
                          <FormControl>
                            <motion.div
                              className="relative"
                              animate={{
                                height: showComponentDetails
                                  ? "64px"
                                  : "calc(100vh/3)",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Editor
                                value={field.value}
                                onValueChange={(code) => {
                                  field.onChange(code)
                                }}
                                highlight={(code) => {
                                  const grammar =
                                    languages.tsx || languages.typescript
                                  return grammar
                                    ? highlight(code, grammar, "tsx")
                                    : code
                                }}
                                padding={10}
                                style={{
                                  fontFamily:
                                    '"Fira code", "Fira Mono", monospace',
                                  fontSize: code.length ? 12 : 20,
                                  backgroundColor: code.length
                                    ? isDarkTheme
                                      ? "#2d2d2d"
                                      : "#f5f5f5"
                                    : "transparent",
                                  borderRadius: "0.375rem",
                                  height: "100%",
                                  overflow: "auto",
                                  outline: "black !important",
                                  color: isDarkTheme ? "#e0e0e0" : "inherit",
                                }}
                                className="mt-1 w-full border border-input"
                              />
                              {showComponentDetails && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.3, delay: 0.3 }}
                                  className="absolute p-2 border  rounded-md inset-0 bg-background text-foreground bg-opacity-80 backdrop-blur-sm flex items-center justify-start"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center">
                                        <div className="w-10 h-10 relative mr-2 items-center justify-center">
                                          <Image
                                            src="/demo-file.svg"
                                            width={40}
                                            height={40}
                                            alt="Demo File"
                                          />
                                        </div>
                                        <div className="flex flex-col items-start">
                                          <p className="font-semibold text-[14px]">
                                            Demo code
                                          </p>
                                          <p className="text-sm text-gray-600 text-[12px]">
                                            for {parsedComponentNames[0]}
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        onClick={() =>
                                          setShowComponentDetails(false)
                                        }
                                      >
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {Object.keys(internalDependencies ?? {}).length > 0 &&
                  showComponentDetails && (
                    <div className="w-full">
                      <Alert className="my-2">
                        <Codepen className="h-4 w-4" />
                        <AlertTitle>Component dependencies detected</AlertTitle>
                        <AlertDescription>
                          To use another component within your component:
                          <br />
                          1. Add it to the Component Community first.
                          <br />
                          2. Enter its slug here.
                        </AlertDescription>
                      </Alert>
                      {Object.entries(internalDependencies ?? {}).map(
                        ([path], index) => (
                          <div
                            key={path}
                            className={`w-full ${index > 0 ? "mt-2" : ""}`}
                          >
                            <label className="block text-sm font-medium text-gray-700">
                              Add slug for {path}
                            </label>
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
                              placeholder="Enter component slug"
                              className="mt-1 w-full"
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}

                {isDebug && (
                  <>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700">
                        Component names
                      </label>
                      <Textarea
                        value={parsedComponentNames?.join(", ")}
                        readOnly
                        className="mt-1 w-full bg-gray-100"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700">
                        Demo component name
                      </label>
                      <Input
                        value={parsedDemoComponentName}
                        readOnly
                        className="mt-1 w-full bg-gray-100"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700">
                        Component dependencies
                      </label>
                      <Textarea
                        value={Object.entries(parsedDependencies ?? {})
                          .map(([key, value]) => `${key}: ${value}`)
                          .join("\n")}
                        readOnly
                        className="mt-1 w-full bg-gray-100"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700">
                        Demo dependencies
                      </label>
                      <Textarea
                        value={Object.entries(parsedDemoDependencies ?? {})
                          .map(([key, value]) => `${key}: ${value}`)
                          .join("\n")}
                        readOnly
                        className="mt-1 w-full bg-gray-100"
                      />
                    </div>
                  </>
                )}

                {showComponentDetails && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="w-full"
                  >
                    <ComponentDetails
                      form={form}
                      previewImage={previewImage}
                      handleFileChange={handleFileChangeWrapper}
                      handleSubmit={handleSubmit}
                      isLoading={isLoading}
                      isFormValid={isFormValid}
                      internalDependencies={internalDependencies ?? {}}
                      componentName={mainComponentName}
                    />
                  </motion.div>
                )}
              </div>

              {previewProps && isPreviewReady && showComponentDetails && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 3 }}
                  className="w-2/3 py-4"
                >
                  <label className="block text-sm font-medium mb-2">
                    Component Preview
                  </label>
                  <React.Suspense fallback={<div>Loading preview...</div>}>
                    <Preview {...previewProps} />
                  </React.Suspense>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </form>
      </Form>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Component Added Successfully</DialogTitle>
            <DialogDescription className="break-words">
              Your new component has been successfully added. What would you
              like to do next?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleAddAnother} variant="outline">
              Add Another
              <Hotkey keys={["N"]} />
            </Button>
            <Button onClick={handleGoToComponent} variant="default">
              View Component
              <Hotkey keys={["⏎"]} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!parsedComponentNames?.length && !isPreviewReady && !isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 mx-auto"
        >
          <Alert>
            <FileTerminal className="h-4 w-4" />
            <AlertTitle>Entire code should be in a single file</AlertTitle>
            <AlertDescription>
              Ensure to include all necessary dependencies to enable everyone{" "}
              <br />
              to use this component and install it seamlessly via the CLI.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      {!showComponentDetails && !!code.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="absolute bottom-4 mx-auto"
        >
          <Alert>
            <SunMoon className="h-4 w-4" />
            <AlertTitle>
              Demo should demonstrate how it functions and appears
            </AlertTitle>
            <AlertDescription>
              Do not add an import statement for the Component,
              <br />
              as it will be imported automatically.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </>
  )
}