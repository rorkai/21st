"use client"

import React, { useCallback, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useComponentFormState } from "./ComponentFormHooks"
import { uploadToStorage, uploadPreviewImage } from "./ComponentFormHelpers"
import {
  formSchema,
  FormData,
  isFormValid,
  formatComponentName,
  TagOption,
} from "./ComponentFormUtils"
import { useState, useEffect, useRef } from "react"
import {
  extractComponentNames,
  extractDemoComponentName,
  parseDependencies,
  parseInternalDependencies,
  removeComponentImports,
} from "@/utils/parsers"
import { generateSlug, isValidSlug } from "@/hooks/useComponentSlug"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/themes/prism.css"
import Image from "next/image"
import { SandpackProvider as SandpackProviderUnstyled } from "@codesandbox/sandpack-react/unstyled"
import CreatableSelect from "react-select/creatable"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { prepareFilesForPreview } from "./ComponentFormUtils"
import { Tag } from "@/types/types"
import {
  addComponent,
  addTagsToComponent,
  useAvailableTags,
} from "@/utils/dataFetchers"

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
  const descriptionRef = useRef<HTMLInputElement>(null)

  const { data: availableTags = [] } = useAvailableTags()

  useEffect(() => {
    if (user) {
      console.log("Current user:", user)
      console.log("User username:", user.username)
    }
  }, [user])

  useEffect(() => {
    const updateSlug = async () => {
      if (name && !componentSlug) {
        const newSlug = await generateUniqueSlug(name)
        form.setValue("component_slug", newSlug)
        setIsSlugManuallyEdited(false)
      }
    }

    updateSlug()
  }, [name, componentSlug, form.setValue, generateUniqueSlug])

  useEffect(() => {
    if (componentSlug && isSlugManuallyEdited) {
      const timer = setTimeout(() => {
        checkSlug(componentSlug)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [componentSlug, checkSlug, isSlugManuallyEdited])

  useEffect(() => {
    setParsedComponentNames(code ? extractComponentNames(code) : [])
    setParsedDependencies(code ? parseDependencies(code) : {})
    setParsedDemoDependencies(demoCode ? parseDependencies(demoCode) : {})
  }, [code, demoCode])

  useEffect(() => {
    setParsedDemoComponentName(
      demoCode ? extractDemoComponentName(demoCode) : "",
    )
  }, [demoCode])

  const checkDemoCode = useCallback(
    (demoCode: string, componentNames: string[]) => {
      const { removedImports } = removeComponentImports(
        demoCode,
        componentNames,
      )

      if (removedImports.length > 0) {
        setImportsToRemove(removedImports)
        setDemoCodeError(
          "Component imports in the Demo component are automatic. Please confirm deletion.",
        )
      } else {
        setImportsToRemove([])
        setDemoCodeError(null)
      }
    },
    [],
  )

  useEffect(() => {
    const componentNames = extractComponentNames(code)
    if (componentNames.length > 0 && demoCode) {
      checkDemoCode(demoCode, componentNames)
    }
  }, [code, demoCode, checkDemoCode])

  useEffect(() => {
    const componentDeps = parseInternalDependencies(code)
    const demoDeps = parseInternalDependencies(demoCode)

    const combinedDeps = { ...componentDeps, ...demoDeps }

    setInternalDependencies(combinedDeps)
  }, [code, demoCode])

  const handleApproveDelete = () => {
    const { modifiedCode } = removeComponentImports(
      demoCode,
      parsedComponentNames,
    )
    form.setValue("demo_code", modifiedCode)
    setImportsToRemove([])
    setDemoCodeError(null)
  }

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
      const componentNames = extractComponentNames(data.code)
      const demoComponentName = extractDemoComponentName(data.demo_code)
      const dependencies = parseDependencies(data.code)

      const cleanedDemoCode = removeComponentImports(
        data.demo_code,
        componentNames,
      ).modifiedCode

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
      generateAndSetSlug(formattedName)
    }
  }, [step, parsedComponentNames, form.setValue])

  const generateAndSetSlug = async (name: string) => {
    const newSlug = await generateUniqueSlug(name)
    form.setValue("component_slug", newSlug)
  }

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

  const ComponentPreview = React.lazy(() =>
    import("@codesandbox/sandpack-react/unstyled").then((module) => ({
      default: module.SandpackPreview,
    })),
  )

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
        <SandpackProviderUnstyled {...providerProps}>
          <ComponentPreview />
        </SandpackProviderUnstyled>
      </div>
    )
  }

  const [previewProps, setPreviewProps] = useState<{
    files: Record<string, string>
    dependencies: Record<string, string>
  } | null>(null)

  const codeMemoized = useMemo(() => form.watch("code"), [form.watch("code")])
  const demoCodeMemoized = useMemo(
    () => form.watch("demo_code"),
    [form.watch("demo_code")],
  )

  useEffect(() => {
    if (
      codeMemoized &&
      demoCodeMemoized &&
      Object.keys(internalDependencies).length === 0 &&
      !isConfirmDialogOpen
    ) {
      const { files, dependencies } = prepareFilesForPreview(
        codeMemoized,
        demoCodeMemoized,
      )
      setPreviewProps({
        files,
        dependencies,
      })
    }
  }, [
    codeMemoized,
    demoCodeMemoized,
    internalDependencies,
    isConfirmDialogOpen,
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

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex w-full h-full items-center justify-center"
        >
          <div className="flex gap-10 items-start h-full w-full mt-2">
            <div className="flex flex-col w-1/2 h-full items-start gap-7 pb-10">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Code</FormLabel>
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
                          minHeight: "calc(100vh/3)",
                          maxHeight: "calc(100vh/3)",
                        }}
                        className="mt-1 w-full border border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          minHeight: "calc(100vh/3)",
                          maxHeight: "calc(100vh/3)",
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
                              onClick={handleApproveDelete}
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

              {Object.keys(internalDependencies).length > 0 && (
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-2">
                    Internal dependencies
                  </h3>
                  {Object.entries(internalDependencies).map(([path, slug]) => (
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
                  ))}
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
            </div>
            {previewProps && Object.keys(internalDependencies).length === 0 && (
              <div className="w-1/2">
                <h3 className="block text-sm font-medium text-gray-700 mb-2">
                  Component Preview
                </h3>
                <Preview {...previewProps} />
              </div>
            )}
          </div>
        </form>
      </Form>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Component Details</DialogTitle>
            <DialogDescription>
              Please check and confirm the details of your component.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="w-full">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <Input
                id="name"
                {...form.register("name", { required: true })}
                className="mt-1 w-full"
                onChange={(e) => {
                  form.setValue("name", e.target.value)
                  generateAndSetSlug(e.target.value)
                }}
              />
            </div>

            <div className="w-full">
              <label
                htmlFor="component_slug"
                className="block text-sm font-medium text-gray-700"
              >
                Slug
              </label>
              <Input
                id="component_slug"
                {...form.register("component_slug", {
                  required: true,
                  validate: isValidSlug,
                })}
                className="mt-1 w-full"
                onChange={(e) => {
                  setIsSlugManuallyEdited(true)
                  checkSlug(e.target.value)
                }}
              />
              {isSlugManuallyEdited && (
                <>
                  {slugChecking ? (
                    <p className="text-gray-500 text-sm mt-1">
                      Checking availability...
                    </p>
                  ) : slugError ? (
                    <p className="text-red-500 text-sm mt-1">{slugError}</p>
                  ) : slugAvailable ? (
                    <p className="text-green-500 text-sm mt-1">
                      This slug is available
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className="w-full">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description (optional)
              </label>
              <Input
                id="description"
                {...form.register("description")}
                className="mt-1 w-full"
                ref={descriptionRef}
              />
            </div>

            <div className="w-full">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700"
              >
                Tags
              </label>
              <Controller
                name="tags"
                control={form.control}
                defaultValue={[]}
                render={({ field }) => {
                  const [tags, setTags] = useState(field.value)

                  const selectOptions = useMemo(
                    () =>
                      availableTags.map((tag) => ({
                        value: tag.id,
                        label: tag.name,
                      })),
                    [availableTags],
                  )

                  return (
                    <CreatableSelect<TagOption, true>
                      {...field}
                      isMulti
                      options={selectOptions}
                      className="mt-1 w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Select or create tags"
                      formatCreateLabel={(inputValue: string) =>
                        `Create "${inputValue}"`
                      }
                      onChange={(newValue) => {
                        const formattedValue = newValue.map((item: any) => ({
                          id: item.__isNew__ ? undefined : item.value,
                          name: item.label,
                          slug: generateSlug(item.label),
                        }))
                        setTags(formattedValue)
                        field.onChange(formattedValue)
                      }}
                      value={tags.map((tag) => ({
                        value: tag.id ?? -1,
                        label: tag.name,
                      }))}
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  )
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={form.watch("is_public")}
                onCheckedChange={(checked) =>
                  form.setValue("is_public", checked)
                }
              />
              <Label htmlFor="is_public">Public component</Label>
            </div>
            <Label htmlFor="is_public">
              {form.watch("is_public")
                ? "This component will be visible to everyone"
                : "This component will be visible only to you"}
            </Label>

            <div className="w-full">
              <Label
                htmlFor="preview_image"
                className="block text-sm font-medium text-gray-700"
              >
                Preview image (recommended resolution: 1200x900 or higher)
              </Label>
              <Input
                id="preview_image"
                type="file"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleFileChange}
                className="mt-1 w-full"
              />
              {previewImage && (
                <div className="mt-2">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    width={300}
                    height={225}
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsConfirmDialogOpen(false)}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                !isFormValid(
                  form,
                  demoCodeError,
                  internalDependencies,
                  slugAvailable,
                  isSlugManuallyEdited,
                )
              }
            >
              {isLoading ? "Adding..." : "Add component"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
