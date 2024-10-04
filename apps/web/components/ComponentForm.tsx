"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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

type FormData = {
  name: string;
  component_slug: string;
  code: string;
  demo_code: string;
  description: string;
  tags: Tag[];
};

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
  const { register, handleSubmit, reset, watch, setValue, control } =
    useForm<FormData>();
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

  const name = watch("name");
  const componentSlug = watch("component_slug");

  useEffect(() => {
    const updateSlug = async () => {
      if (name) {
        const newSlug = await generateUniqueSlug(name);
        setValue("component_slug", newSlug);
      }
    };

    updateSlug();
  }, [name, setValue, generateUniqueSlug]);

  useEffect(() => {
    if (componentSlug) {
      checkSlug(componentSlug);
    }
  }, [componentSlug, checkSlug]);

  const code = watch("code");
  const demoCode = watch("demo_code");

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
    setValue("demo_code", modifiedCode);
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

  const onSubmit = async (data: FormData) => {
    if (!slugAvailable || demoCodeError) {
      alert("Please fix errors and try again.");
      return;
    }

    if (Object.values(internalDependencies).some((slug) => !slug)) {
      alert("Please specify the slug for all internal dependencies");
      return;
    }

    let modifiedCode = data.code;
    let modifiedDemoCode = data.demo_code;
    Object.entries(internalDependencies).forEach(([path, slug]) => {
      const regex = new RegExp(`from\\s+["']${path}["']`, "g");
      const replacement = `from "@/components/${slug}"`;
      modifiedCode = modifiedCode.replace(regex, replacement);
      modifiedDemoCode = modifiedDemoCode.replace(regex, replacement);
    });

    setIsLoading(true);
    try {
      const componentNames = extractComponentNames(modifiedCode);
      const demoComponentName = extractDemoComponentName(modifiedDemoCode);
      const dependencies = parseDependencies(modifiedCode);

      const cleanedDemoCode = removeComponentImports(
        modifiedDemoCode,
        componentNames
      ).modifiedCode;

      const codeFileName = `${data.component_slug}-code.tsx`;
      const demoCodeFileName = `${data.component_slug}-demo.tsx`;

      const [codeUrl, demoCodeUrl] = await Promise.all([
        uploadToStorage(codeFileName, modifiedCode),
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
        })
        .select()
        .single();

      if (error) throw error;

      if (insertedData) {
        await addTagsToComponent(insertedData.id, data.tags);

        setNewComponentSlug(data.component_slug);
        setIsSuccessDialogOpen(true);
      }
    } catch (error) {
      console.error("Error adding component:", error);
      alert("An error occurred while adding the component");
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
      setValue("name", formattedName);
      generateAndSetSlug(formattedName);
    }
  }, [step, parsedComponentNames, setValue]);

  const generateAndSetSlug = async (name: string) => {
    const newSlug = await generateUniqueSlug(name);
    setValue("component_slug", newSlug);
  };

  const handleGoToComponent = () => {
    if (user) {
      router.push(`/${user.username}/${newComponentSlug}`);
    }
    setIsSuccessDialogOpen(false);
  };

  const handleAddAnother = () => {
    reset();
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
    <div className="flex justify-center items-center h-screen p-4">
      <${demoComponentName} />
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

const codeMemoized = useMemo(() => watch("code"), [watch("code")]);
const demoCodeMemoized = useMemo(() => watch("demo_code"), [watch("demo_code")]);

useEffect(() => {
  if (codeMemoized && demoCodeMemoized && Object.keys(internalDependencies).length === 0) {
    const { files, dependencies } = prepareFilesForPreview(codeMemoized, demoCodeMemoized);
    setPreviewProps({
      files,
      dependencies,
    });
  } else {
    setPreviewProps(null);
  }
}, [codeMemoized, demoCodeMemoized, internalDependencies]);

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full h-full items-center justify-center"
      >
        {step === 1 ? (
          <div className="flex gap-10 items-start h-full w-full mt-2">
            <div className="flex flex-col w-1/2 h-full items-start gap-7 pb-10">
              
              <div className="w-full">
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Code
                </label>
                <Textarea
                  id="code"
                  {...register("code", { required: true })}
                  className="mt-1 w-full h-[calc(100vh/3)] min-h-[100px]"
                />
              </div>

              <div className="w-full">
                <label
                  htmlFor="demo_code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Demo code (without component import)
                </label>
                <Textarea
                  id="demo_code"
                  {...register("demo_code", { required: true })}
                  className={`mt-1 w-full h-[calc(100vh/3)] min-h-[100px] ${demoCodeError ? "border-yellow-500" : ""}`}
                />
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
              </div>

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
                onClick={() => setStep(2)}
                disabled={
                  !watch("code") ||
                  !watch("demo_code") ||
                  Object.values(internalDependencies).some((slug) => !slug)
                }
                className="w-full max-w-[150px] mr-auto"
              >
                Next
              </Button>
            </div>
            {previewProps && Object.keys(internalDependencies).length === 0 && (
              <div className="w-1/2">
                <h3 className="block text-sm font-medium text-gray-700 mb-1">Component preview</h3>
                <Preview {...previewProps} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col w-full h-full items-center max-w-[400px] justify-center gap-4 mt-10">
            <div className="w-full">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <Input
                id="name"
                {...register("name", { required: true })}
                className="mt-1 w-full"
                defaultValue={formatComponentName(
                  parsedComponentNames[0] || ""
                )}
                onChange={(e) => generateAndSetSlug(e.target.value)}
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
                {...register("component_slug", {
                  required: true,
                  validate: isValidSlug,
                })}
                className="mt-1 w-full"
              />
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
                {...register("description")}
                className="mt-1 w-full"
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
                control={control}
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
                    />
                  );
                }}
              />
            </div>

            <div className="flex space-x-2 w-full justify-between">
              <Button onClick={() => setStep(1)} variant="outline" className="w-1/4">
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !slugAvailable || !!demoCodeError}
                className="w-1/3"
              >
                {isLoading ? "Adding..." : "Add component"}
              </Button>
            </div>
          </div>
        )}
      </form>

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