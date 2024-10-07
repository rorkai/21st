"use client"

import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useComponentFormState } from "./ComponentFormHooks"
import {
  uploadToStorage,
  uploadPreviewImage,
  checkDemoCode,
  handleApproveDelete,
  handleFileChange,
  generateAndSetSlug,
  updateDependencies,
} from "./ComponentFormHelpers"
import {
  formSchema,
  FormData,
  isFormValid,
  formatComponentName,
  prepareFilesForPreview,
} from "./ComponentFormUtils"
import {
  extractComponentNames,
  extractDependencies,
  extractDemoComponentName,
  findInternalDependencies,
} from "../utils/parsers"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/themes/prism.css"
import { SandpackProvider } from "@codesandbox/sandpack-react/unstyled"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert } from "@/components/ui/alert"
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

import {
  addComponent,
  addTagsToComponent,
  useAvailableTags,
} from "@/utils/dataFetchers"

import ComponentConfirmationForm from "./ComponentConfirmationForm"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const ComponentPreview = React.lazy(() =>
  import("@codesandbox/sandpack-react/unstyled").then((module) => ({
    default: module.SandpackPreview,
  })),
)

export default function ComponentForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      component_slug: "",
      code: "",
      demo_code: "",
      description: "",
      tags: [],
      is_public: true,
    },
  })

  const {
    isLoading,
    setIsLoading,
    step,
    setStep,
    isSuccessDialogOpen,
    setIsSuccessDialogOpen,
    newComponentSlug,
    setNewComponentSlug,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    isSlugManuallyEdited,
    setIsSlugManuallyEdited,
    previewImage,
    setPreviewImage,
    demoCodeError,
    setDemoCodeError,
    parsedDependencies,
    setParsedDependencies,
    parsedComponentNames,
    setParsedComponentNames,
    parsedDemoDependencies,
    setParsedDemoDependencies,
    internalDependencies,
    setInternalDependencies,
    importsToRemove,
    setImportsToRemove,
    parsedDemoComponentName,
    setParsedDemoComponentName,
    user,
    client,
    isDebug,
    slugAvailable,
    slugChecking,
    slugError,
    generateUniqueSlug,
    checkSlug,
    validTags,
    name,
    componentSlug,
    code,
    demoCode,
  } = useComponentFormState(form)

  const router = useRouter()

  const { data: availableTags = [] } = useAvailableTags()

  const [isCodeUploaded, setIsCodeUploaded] = useState(false)

  // Добавьте новое состояние для отслеживания, был ли вставлен код компонента
  const [isComponentCodeEntered, setIsComponentCodeEntered] = useState(false)

  useEffect(() => {
    if (user) {
      console.log("Current user:", user)
      console.log("User username:", user.username)
    }
  }, [user])

  useEffect(() => {
    const updateSlug = async () => {
      if (name && !componentSlug) {
        await generateAndSetSlug(name, generateUniqueSlug, form)
        setIsSlugManuallyEdited(false)
      }
    }

    updateSlug()
  }, [name, componentSlug, form, generateUniqueSlug, setIsSlugManuallyEdited])

  useEffect(() => {
    if (componentSlug && isSlugManuallyEdited) {
      const timer = setTimeout(() => {
        checkSlug(componentSlug)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [componentSlug, checkSlug, isSlugManuallyEdited])

  useEffect(() => {
    const updateDependencies = () => {
      try {
        console.log("Full component code:", code)
        const componentNames = extractComponentNames(code)
        console.log("Parsed exported component names:", componentNames)
        setParsedComponentNames(componentNames)

        const dependencies = extractDependencies(code)
        setParsedDependencies(dependencies)

        const demoDependencies = extractDependencies(demoCode)
        setParsedDemoDependencies(demoDependencies)

        const demoComponentName = extractDemoComponentName(demoCode)
        setParsedDemoComponentName(demoComponentName)

        setInternalDependencies(
          findInternalDependencies(dependencies, demoDependencies),
        )
      } catch (error) {
        console.error("Error updating dependencies:", error)
      }
    }

    updateDependencies()
  }, [code, demoCode])

  useEffect(() => {
    const componentNames = parsedComponentNames
    if (componentNames.length > 0 && demoCode) {
      checkDemoCode(
        demoCode,
        componentNames,
        setImportsToRemove,
        setDemoCodeError,
      )
    }
  }, [code, demoCode, parsedComponentNames])

  const handleApproveDeleteWrapper = () => {
    handleApproveDelete(
      demoCode,
      parsedComponentNames,
      form,
      setImportsToRemove,
      setDemoCodeError,
    )
  }

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

    console.log("onSubmit called with data:", data)

    if (!slugAvailable && isSlugManuallyEdited) {
      console.error("Slug is not available")
      alert("The chosen slug is not available. Please choose a different one.")
      return
    }

    if (demoCodeError) {
      console.error("Demo code error:", demoCodeError)
      alert(
        "There's an error in the demo code. Please fix it before submitting.",
      )
      return
    }

    if (Object.values(internalDependencies).some((slug) => !slug)) {
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
        uploadToStorage(client, codeFileName, data.code),
        uploadToStorage(client, demoCodeFileName, cleanedDemoCode),
      ])

      const installUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/r/${data.component_slug}`

      let previewImageUrl = ""
      if (data.preview_url) {
        previewImageUrl = await uploadPreviewImage(
          client,
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
        is_public: data.is_public,
        preview_url: previewImageUrl,
      }

      const insertedData = await addComponent(componentData)

      if (insertedData) {
        await addTagsToComponent(insertedData.id, validTags || [])

        setNewComponentSlug(data.component_slug)
        setIsConfirmDialogOpen(false)
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

  useEffect(() => {
    if (step === 2 && parsedComponentNames.length > 0) {
      const formattedName = formatComponentName(parsedComponentNames[0] || "")
      form.setValue("name", formattedName)
      generateAndSetSlug(formattedName, generateUniqueSlug, form)
    }
  }, [step, parsedComponentNames, form, generateUniqueSlug])

  const handleGoToComponent = () => {
    if (user) {
      router.push(`/${user.username}/${newComponentSlug}`)
    }
    setIsSuccessDialogOpen(false)
  }

  const handleAddAnother = () => {
    form.reset()
    setStep(1)
    setIsSuccessDialogOpen(false)
  }

  function Preview({
    files,
    dependencies,
  }: {
    files: Record<string, string>
    dependencies: Record<string, string>
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
          "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/css/compiled-tailwind.css",
        ],
      },
    }

    return (
      <div className="w-full bg-[#FAFAFA] rounded-lg">
        <SandpackProvider {...providerProps}>
          <ComponentPreview />
        </SandpackProvider>
      </div>
    )
  }

  const [previewProps, setPreviewProps] = useState<{
    files: Record<string, string>
    dependencies: Record<string, string>
  } | null>(null)

  useEffect(() => {
    if (
      code &&
      demoCode &&
      Object.keys(internalDependencies).length === 0 &&
      !isConfirmDialogOpen &&
      !demoCodeError &&
      importsToRemove.length === 0
    ) {
      const { files, dependencies } = prepareFilesForPreview(code, demoCode)
      setPreviewProps({ files, dependencies })
    } else {
      setPreviewProps(null)
    }
  }, [
    code,
    demoCode,
    internalDependencies,
    isConfirmDialogOpen,
    demoCodeError,
    importsToRemove,
  ])

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (
        isFormValid(
          form,
          demoCodeError,
          internalDependencies,
          slugAvailable,
          isSlugManuallyEdited,
        )
      ) {
        const formData = form.getValues()
        onSubmit(formData)
      } else {
        console.error("Form is not valid")
        alert("Please fill in all required fields correctly before submitting.")
      }
    },
    [
      isFormValid,
      onSubmit,
      form,
      demoCodeError,
      internalDependencies,
      slugAvailable,
      isSlugManuallyEdited,
    ],
  )

  const [isPreviewReady, setIsPreviewReady] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (
      previewProps &&
      Object.keys(internalDependencies).length === 0 &&
      !isConfirmDialogOpen &&
      !demoCodeError &&
      importsToRemove.length === 0 &&
      code &&
      demoCode
    ) {
      setIsPreviewReady(true)
    } else {
      setIsPreviewReady(false)
    }
  }, [
    previewProps,
    internalDependencies,
    isConfirmDialogOpen,
    demoCodeError,
    importsToRemove,
    code,
    demoCode,
  ])

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex w-full h-full items-center justify-center"
        >
          <AnimatePresence>
            <motion.div
              key="form-container"
              className="flex gap-4 items-center h-full w-full mt-2"
              initial={false}
              animate={isMounted && isPreviewReady ? "withPreview" : "centered"}
              variants={{
                centered: { justifyContent: "center" },
                withPreview: { justifyContent: "flex-start" },
              }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="flex flex-col items-start gap-7 pb-10"
                initial={false}
                animate={
                  isMounted && isPreviewReady ? "withPreview" : "centered"
                }
                variants={{
                  centered: { width: "100%", maxWidth: "500px" },
                  withPreview: {
                    width: "50%",
                    maxWidth: "none",
                    minWidth: "50%",
                  },
                }}
                transition={{ duration: 0.5 }}
              >
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="w-full relative">
                      {!isCodeUploaded && (
                        <FormLabel>Paste Component Code</FormLabel>
                      )}
                      <FormControl>
                        <motion.div
                          animate={{ height: isCodeUploaded ? 100 : "auto" }}
                          transition={{ duration: 0.5 }}
                          className="relative"
                        >
                          <Editor
                            value={field.value}
                            onValueChange={(code) => {
                              field.onChange(code)
                              setIsCodeUploaded(code.trim().length > 0)
                              setIsComponentCodeEntered(code.trim().length > 0)
                            }}
                            highlight={(code) => {
                              const grammar = languages.tsx || languages.jsx
                              return grammar
                                ? highlight(code, grammar, "tsx")
                                : code
                            }}
                            padding={10}
                            style={{
                              fontFamily: '"Fira code", "Fira Mono", monospace',
                              fontSize: 12,
                              backgroundColor: "#f5f5f5",
                              borderRadius: "0.375rem",
                              height: isCodeUploaded
                                ? "100px"
                                : "calc(100vh/3)",
                              overflow: "auto",
                              outline: "none !important",
                            }}
                            className="mt-1 w-full border border-input"
                          />
                          <AnimatePresence>
                            {isCodeUploaded && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute border rounded-md inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center"
                              >
                                <div className="flex items-center">
                                  <Image
                                    src="/tsx-file.svg"
                                    width={40}
                                    height={40}
                                    alt="TSX File"
                                    className="mr-4"
                                  />
                                  <div className="flex gap-2 items-center justify-center">
                                    <p className="text-sm text-gray-600">
                                      {" "}
                                      {parsedComponentNames.join(", ")}
                                    </p>

                                    <Button
                                      onClick={() => setIsCodeUploaded(false)}
                                      variant="ghost"
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isComponentCodeEntered && (
                  <FormField
                    control={form.control}
                    name="demo_code"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Demo Code</FormLabel>
                        <FormControl>
                          <Editor
                            value={field.value}
                            onValueChange={(code) => field.onChange(code)}
                            highlight={(code) => {
                              const grammar = languages.tsx || languages.jsx
                              return grammar
                                ? highlight(code, grammar, "tsx")
                                : code
                            }}
                            padding={10}
                            style={{
                              fontFamily: '"Fira code", "Fira Mono", monospace',
                              fontSize: 12,
                              backgroundColor: "#f5f5f5",
                              borderRadius: "0.375rem",
                              height: "calc(100vh/3)",
                              overflow: "auto",
                            }}
                            className={`mt-1 w-full border border-input ${demoCodeError ? "border-yellow-500" : ""}`}
                          />
                        </FormControl>
                        <FormMessage />
                        {demoCodeError && (
                          <Alert
                            variant="default"
                            className="mt-2 text-[14px] w-full"
                          >
                            <p>{demoCodeError}</p>
                            {importsToRemove.map((importStr, index) => (
                              <div
                                key={index}
                                className="bg-gray-100 p-2 mt-2 rounded flex flex-col w-full"
                              >
                                <code className="mb-2">{importStr}</code>
                                <Button
                                  onClick={handleApproveDeleteWrapper}
                                  size="sm"
                                  className="self-end"
                                >
                                  Delete
                                </Button>
                              </div>
                            ))}
                          </Alert>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                {Object.keys(internalDependencies).length > 0 && (
                  <div className="w-full">
                    <h3 className="text-lg font-semibold mb-2">
                      Internal dependencies
                    </h3>
                    {Object.entries(internalDependencies).map(
                      ([path, slug]) => (
                        <div key={path} className="mb-2 w-full">
                          <label className="block text-sm font-medium text-gray-700">
                            {path}
                          </label>
                          <Input
                            value={slug}
                            onChange={(e) => {
                              setInternalDependencies((prev) => ({
                                ...prev,
                                [path]: e.target.value,
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
                        value={parsedComponentNames.join(", ")}
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
                        value={Object.entries(parsedDependencies)
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
                        value={Object.entries(parsedDemoDependencies)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join("\n")}
                        readOnly
                        className="mt-1 w-full bg-gray-100"
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  disabled={
                    !form.watch("code") ||
                    !form.watch("demo_code") ||
                    Object.values(internalDependencies).some((slug) => !slug)
                  }
                  className="w-full max-w-[150px] mr-auto"
                >
                  Next
                </Button>
              </motion.div>
              {previewProps && isMounted && isPreviewReady && (
                <motion.div
                  key="preview"
                  className="w-1/2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="block text-sm font-medium text-gray-700 mb-2">
                    Component Preview
                  </h3>
                  <React.Suspense fallback={<div>Loading preview...</div>}>
                    <Preview {...previewProps} />
                  </React.Suspense>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </form>
      </Form>

      <ComponentConfirmationForm
        isConfirmDialogOpen={isConfirmDialogOpen}
        setIsConfirmDialogOpen={setIsConfirmDialogOpen}
        form={form}
        isSlugManuallyEdited={isSlugManuallyEdited}
        setIsSlugManuallyEdited={setIsSlugManuallyEdited}
        slugChecking={slugChecking}
        slugError={slugError}
        slugAvailable={slugAvailable}
        checkSlug={checkSlug}
        generateAndSetSlug={(name) =>
          generateAndSetSlug(name, generateUniqueSlug, form)
        }
        availableTags={availableTags}
        previewImage={previewImage}
        handleFileChange={handleFileChangeWrapper}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        isFormValid={isFormValid}
        demoCodeError={demoCodeError}
        internalDependencies={internalDependencies}
      />

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
            </Button>
            <Button onClick={handleGoToComponent} variant="default">
              View Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
