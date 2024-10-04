"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { useAtom, atom } from "jotai";
import { useDebugMode } from "@/hooks/useDebugMode";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SandpackProvider as SandpackProviderUnstyled } from "@codesandbox/sandpack-react/unstyled";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreatableSelect from "react-select/creatable";
import { Tag } from "@/types/types";
import { useClerkSupabaseClient } from "@/utils/clerk";
import {
  extractComponentNames,
  extractDemoComponentName,
  parseDependencies,
  parseInternalDependencies,
  removeComponentImports
} from "@/utils/parsers";
import { useComponentSlug, generateSlug, isValidSlug } from '@/hooks/useComponentSlug';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useValidTags } from '@/hooks/useValidateTags';
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/themes/prism.css';


const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  component_slug: z.string().min(2, {
    message: "Slug must be at least 2 characters.",
  }),
  code: z.string().min(1, {
    message: "Component code is required.",
  }),
  demo_code: z.string().min(1, {
    message: "Demo code is required.",
  }),
  description: z.string().optional(),
  tags: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
    slug: z.string(),
  })).optional().default([]),
  is_public: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

// Define the TagOption interface at the top of the file or import it if it's defined elsewhere
interface TagOption {
  value: number;
  label: string;
  __isNew__?: boolean;
}

const demoCodeErrorAtom = atom<string | null>(null);
const parsedDependenciesAtom = atom<Record<string, string>>({});
const parsedComponentNamesAtom = atom<string[]>([]);
const parsedDemoDependenciesAtom = atom<Record<string, string>>({});
const internalDependenciesAtom = atom<Record<string, string>>({});
const importsToRemoveAtom = atom<string[]>([]);
const parsedDemoComponentNameAtom = atom<string>("");



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
  });
  const [isLoading, setIsLoading] = useState(false);
  const {
    slugAvailable,
    slugChecking,
    slugError,
    generateUniqueSlug,
    checkSlug,
  } = useComponentSlug();
  const [demoCodeError, setDemoCodeError] = useAtom(demoCodeErrorAtom);
  const [parsedDependencies, setParsedDependencies] = useAtom(
    parsedDependenciesAtom
  );
  const [parsedComponentNames, setParsedComponentNames] = useAtom(
    parsedComponentNamesAtom
  );
  const [parsedDemoDependencies, setParsedDemoDependencies] = useAtom(
    parsedDemoDependenciesAtom
  );
  const [internalDependencies, setInternalDependencies] = useAtom(
    internalDependenciesAtom
  );
  const [importsToRemove, setImportsToRemove] = useAtom(importsToRemoveAtom);
  const [parsedDemoComponentName, setParsedDemoComponentName] = useAtom(
    parsedDemoComponentNameAtom
  );
  const isDebug = useDebugMode();
  const { user } = useUser();
  const client = useClerkSupabaseClient();
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [newComponentSlug, setNewComponentSlug] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const descriptionRef = useRef<HTMLInputElement>(null);

  const name = form.watch("name");
  const componentSlug = form.watch("component_slug");

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  useEffect(() => {
    const updateSlug = async () => {
      if (name && !componentSlug) {
        const newSlug = await generateUniqueSlug(name);
        form.setValue("component_slug", newSlug);
        setIsSlugManuallyEdited(false);
      }
    };

    updateSlug();
  }, [name, componentSlug, form.setValue, generateUniqueSlug]);

  useEffect(() => {
    if (componentSlug && isSlugManuallyEdited) {
      const timer = setTimeout(() => {
        checkSlug(componentSlug);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [componentSlug, checkSlug, isSlugManuallyEdited]);

  const code = form.watch("code");
  const demoCode = form.watch("demo_code");

  useEffect(() => {
    setParsedComponentNames(code ? extractComponentNames(code) : []);
    setParsedDependencies(code ? parseDependencies(code) : {});
    setParsedDemoDependencies(demoCode ? parseDependencies(demoCode) : {});
  }, [code, demoCode]);

  useEffect(() => {
    setParsedDemoComponentName(
      demoCode ? extractDemoComponentName(demoCode) : ""
    );
  }, [demoCode]);

  const checkDemoCode = useCallback(
    (demoCode: string, componentNames: string[]) => {
      const { removedImports } = removeComponentImports(
        demoCode,
        componentNames
      );

      if (removedImports.length > 0) {
        setImportsToRemove(removedImports);
        setDemoCodeError(
          "Component imports in the Demo component are automatic. Please confirm deletion."
        );
      } else {
        setImportsToRemove([]);
        setDemoCodeError(null);
      }
    },
    []
  );

  useEffect(() => {
    const componentNames = extractComponentNames(code);
    if (componentNames.length > 0 && demoCode) {
      checkDemoCode(demoCode, componentNames);
    }
  }, [code, demoCode, checkDemoCode]);

  useEffect(() => {
    const componentDeps = parseInternalDependencies(code);
    const demoDeps = parseInternalDependencies(demoCode);

    const combinedDeps = { ...componentDeps, ...demoDeps };

    setInternalDependencies(combinedDeps);
  }, [code, demoCode]);

  const handleApproveDelete = () => {
    const { modifiedCode } = removeComponentImports(
      demoCode,
      parsedComponentNames
    );
    form.setValue("demo_code", modifiedCode);
    setImportsToRemove([]);
    setDemoCodeError(null);
  };

  const loadAvailableTags = useCallback(async () => {
    const { data, error } = await client.from("tags").select("*").order("name");

    if (error) {
      console.error("Error loading tags:", error);
    } else {
      setAvailableTags(data || []);
    }
  }, [client]);

  useEffect(() => {
    loadAvailableTags();
  }, [loadAvailableTags]);

  const addTagsToComponent = async (componentId: number, tags: Tag[]) => {
    for (const tag of tags) {
      let tagId: number;

      if (tag.id) {
        tagId = tag.id;
      } else {
        const slug = generateSlug(tag.name);
        const { data: existingTag, error: selectError } = await client
          .from("tags")
          .select("id")
          .eq("slug", slug)
          .single();

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error: insertError } = await client
            .from("tags")
            .insert({ name: tag.name, slug })
            .single();

          if (insertError) {
            console.error("Error inserting tag:", insertError);
            continue;
          }
          if (newTag && typeof newTag === "object" && "id" in newTag) {
            tagId = (newTag as { id: number }).id;
          } else {
            console.error("New tag was not created or does not have an id");
            continue;
          }
        }
      }

      const { error: linkError } = await client
        .from("component_tags")
        .insert({ component_id: componentId, tag_id: tagId });

      if (linkError) {
        console.error("Error linking tag to component:", linkError);
      }
    }
  };

  const { data: validTags, isLoading: isValidatingTags } = useValidTags(form.watch("tags"));

  const isFormValid = useCallback(() => {
    const { name, component_slug, code, demo_code } = form.getValues();
    const valid = (
      name.length >= 2 &&
      component_slug.length >= 2 &&
      code.length > 0 &&
      demo_code.length > 0 &&
      !demoCodeError &&
      Object.values(internalDependencies).every((slug) => slug) &&
      (slugAvailable || !isSlugManuallyEdited)
    );
    
    return valid;
  }, [form, demoCodeError, internalDependencies, slugAvailable, isSlugManuallyEdited]);

  const onSubmit = async (data: FormData) => {
    console.log("onSubmit called with data:", data);
    
    if (!slugAvailable && isSlugManuallyEdited) {
      console.error("Slug is not available");
      alert("The chosen slug is not available. Please choose a different one.");
      return;
    }

    if (demoCodeError) {
      console.error("Demo code error:", demoCodeError);
      alert("There's an error in the demo code. Please fix it before submitting.");
      return;
    }

    if (Object.values(internalDependencies).some((slug) => !slug)) {
      console.error("Internal dependencies not specified");
      alert("Please specify the slug for all internal dependencies");
      return;
    }

    setIsLoading(true);
    try {
      const componentNames = extractComponentNames(data.code);
      const demoComponentName = extractDemoComponentName(data.demo_code);
      const dependencies = parseDependencies(data.code);

      const cleanedDemoCode = removeComponentImports(
        data.demo_code,
        componentNames
      ).modifiedCode;

      const codeFileName = `${data.component_slug}-code.tsx`;
      const demoCodeFileName = `${data.component_slug}-demo.tsx`;

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToStorage(codeFileName, data.code),
        uploadToStorage(demoCodeFileName, cleanedDemoCode),
      ]);

      const installUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/r/${data.component_slug}`;

      const { data: insertedData, error } = await client
        .from("components")
        .insert({
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
        })
        .select()
        .single();

      if (error) throw error;

      if (insertedData) {
        await addTagsToComponent(insertedData.id, validTags || []);

        setNewComponentSlug(data.component_slug);
        setIsConfirmDialogOpen(false);  
        setIsSuccessDialogOpen(true);  
      }
    } catch (error) {
      console.error("Error adding component:", error);
      alert("An error occurred while adding the component: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToStorage = async (fileName: string, content: string) => {
    const { error } = await client.storage
      .from("components")
      .upload(fileName, content, {
        contentType: "text/plain",
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = client.storage
      .from("components")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const formatComponentName = (name: string): string => {
    return name.replace(/([A-Z])/g, " $1").trim();
  };

  useEffect(() => {
    if (step === 2 && parsedComponentNames.length > 0) {
      const formattedName = formatComponentName(parsedComponentNames[0] || "");
      form.setValue("name", formattedName);
      generateAndSetSlug(formattedName);
    }
  }, [step, parsedComponentNames, form.setValue]);

  const generateAndSetSlug = async (name: string) => {
    const newSlug = await generateUniqueSlug(name);
    form.setValue("component_slug", newSlug);
  };

  const handleGoToComponent = () => {
    if (user) {
      router.push(`/${user.username}/${newComponentSlug}`);
    }
    setIsSuccessDialogOpen(false);
  };

  const handleAddAnother = () => {
    form.reset();
    setStep(1);
    setIsSuccessDialogOpen(false);
  };


  const ComponentPreview = React.lazy(() => import("@codesandbox/sandpack-react/unstyled").then(module => ({ default: module.SandpackPreview })));

  function Preview({ files, dependencies }: { files: Record<string, string>, dependencies: Record<string, string> }) {
    const [isComponentsLoaded, setIsComponentsLoaded] = useState(false);
  
    useEffect(() => {
      const loadComponents = async () => {
        await import("@codesandbox/sandpack-react/unstyled");
        setIsComponentsLoaded(true);
      };
      loadComponents();
    }, []);
  
    if (!isComponentsLoaded) {
      return <div>Loading preview...</div>;
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
          "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/css/compiled-tailwind.css"
        ],
      },
    };
  
    return (
      <div className="w-full bg-[#FAFAFA] rounded-lg">
        <SandpackProviderUnstyled {...providerProps}>
          <ComponentPreview />
        </SandpackProviderUnstyled>
      </div>
    );
  }

const prepareFilesForPreview = (code: string, demoCode: string) => {
  const componentNames = extractComponentNames(code);
  const demoComponentName = extractDemoComponentName(demoCode);

  const updatedDemoCode = `import { ${componentNames.join(", ")} } from "./Component";\n${demoCode}`;

  const files = {
    "/App.tsx": `
import React from 'react';
import { ${demoComponentName} } from './Demo';

export default function App() {
  return (
    <div className="flex justify-center items-center h-screen p-4 relative">
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        opacity: 0.5,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(#00000055 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }}>
        <style>{
          \`@media (prefers-color-scheme: dark) {
            div {
              background: radial-gradient(#ffffff22 1px, transparent 1px);
            }
          }\`
        }</style>
      </div>
      <div className="flex justify-center items-center max-w-[600px] w-full h-full max-h-[600px] p-4 relative">
      <${demoComponentName} />
      </div>
    </div>
  );
}
`,
    "/Component.tsx": code,
    "/Demo.tsx": updatedDemoCode,
    "/lib/utils.ts": `
export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
`,
    "/tsconfig.json": JSON.stringify({
      compilerOptions: {
        jsx: "react-jsx",
        esModuleInterop: true,
        baseUrl: ".",
        paths: {
          "@/*": ["./*"],
        },
      },
    }, null, 2),
  };

  const dependencies = {
    ...parseDependencies(code),
    ...parseDependencies(demoCode),
  };

  return { files, dependencies };
};


const [previewProps, setPreviewProps] = useState<{ files: Record<string, string>, dependencies: Record<string, string> } | null>(null);

const codeMemoized = useMemo(() => form.watch("code"), [form.watch("code")]);
const demoCodeMemoized = useMemo(() => form.watch("demo_code"), [form.watch("demo_code")]);

useEffect(() => {
  if (codeMemoized && demoCodeMemoized && Object.keys(internalDependencies).length === 0 && !isConfirmDialogOpen) {
    const { files, dependencies } = prepareFilesForPreview(codeMemoized, demoCodeMemoized);
    setPreviewProps({
      files,
      dependencies,
    });
    }
  }, [codeMemoized, demoCodeMemoized, internalDependencies, isConfirmDialogOpen]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    console.log("handleSubmit called, form validity:", isFormValid());
    if (isFormValid()) {
      const formData = form.getValues();
      console.log("Form data:", formData);
      onSubmit(formData);
    } else {
      console.error("Form is not valid");
      alert("Please fill in all required fields correctly before submitting.");
    }
  }, [isFormValid, onSubmit, form]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (isConfirmDialogOpen && isFormValid()) {
        handleSubmit(event);
      }
    }
  }, [isConfirmDialogOpen, isFormValid, handleSubmit]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="flex w-full h-full items-center justify-center">
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
                          const grammar = languages.tsx || languages.jsx;
                          return grammar ? highlight(code, grammar, 'tsx') : code;
                        }}
                        padding={10}
                        style={{
                          fontFamily: '"Fira code", "Fira Mono", monospace',
                          fontSize: 12,
                          backgroundColor: '#f5f5f5',
                          borderRadius: '0.375rem',
                          minHeight: 'calc(100vh/3)',
                          maxHeight: 'calc(100vh/3)',
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
                          const grammar = languages.tsx || languages.jsx;
                          return grammar ? highlight(code, grammar, 'tsx') : code;
                        }}
                        padding={10}
                        style={{
                          fontFamily: '"Fira code", "Fira Mono", monospace',
                          fontSize: 12,
                          backgroundColor: '#f5f5f5',
                          borderRadius: '0.375rem',
                          minHeight: 'calc(100vh/3)',
                          maxHeight: 'calc(100vh/3)',
                        }}
                        className={`mt-1 w-full border border-input ${demoCodeError ? "border-yellow-500" : ""}`}
                      />
                    </FormControl>
                    <FormMessage />
                    {demoCodeError && (
                      <Alert variant="default" className="mt-2 text-[14px] w-full">
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
                          }));
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
                <h3 className="block text-sm font-medium text-gray-700 mb-2">Component Preview</h3>
                <Preview {...previewProps} />
              </div>
            )}
          </div>
        </form>
      </Form>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onKeyDown={handleKeyDown}>
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
                  form.setValue("name", e.target.value);
                  generateAndSetSlug(e.target.value);
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
                  setIsSlugManuallyEdited(true);
                  checkSlug(e.target.value);
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
                  const [tags, setTags] = useState(field.value);

                  const selectOptions = useMemo(
                    () =>
                      availableTags.map((tag) => ({
                        value: tag.id,
                        label: tag.name,
                      })),
                    [availableTags]
                  );

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
                        }));
                        setTags(formattedValue);
                        field.onChange(formattedValue);
                      }}
                      value={tags.map((tag) => ({
                        value: tag.id ?? -1,
                        label: tag.name,
                      }))}
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  );
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={form.watch("is_public")}
                onCheckedChange={(checked) => form.setValue("is_public", checked)}
              />
              <Label htmlFor="is_public">Public component</Label>
            
            </div>
            <Label htmlFor="is_public">
              {form.watch("is_public")
                ? "This component will be visible to everyone"
                : "This component will be visible only to you"}
            </Label>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsConfirmDialogOpen(false)} variant="outline">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid()}
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
  );
}