export const defaultTailwindConfig = `module.exports = {
  darkMode: ["class"],
  content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  },
  plugins: []
}`

export const defaultGlobalCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  max-width: 100vw;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 5.9% 90%;
    --input: 240 4.9% 83.9%;
    --ring: 240 5% 64.9%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 240 4.8% 95.9%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 5.9% 10%;
    --muted-foreground: 240 4.4% 58%;
    --accent: 240 5.9% 10%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 3.8% 46.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}
`

export function generateSandpackFiles({
  demoComponentNames,
  componentSlug,
  relativeImportPath,
  code,
  demoCode,
  theme,
  css,
  customTailwindConfig,
  customGlobalCss,
}: {
  demoComponentNames: string[]
  componentSlug: string
  relativeImportPath: string
  code: string
  demoCode: string
  theme: "light" | "dark"
  css: string
  customTailwindConfig?: string
  customGlobalCss?: string
}) {
  const pathParts = relativeImportPath.split("/")
  const isBlocksRegistry = pathParts[pathParts.length - 1] === "blocks"
  console.log(
    "Path:",
    relativeImportPath,
    "Last part:",
    pathParts[pathParts.length - 1],
    "Is blocks:",
    isBlocksRegistry,
  )

  const appTsxContent = isBlocksRegistry
    ? `
import React, { useState } from 'react';
import { ThemeProvider } from './next-themes';
import { RouterProvider } from 'next/router';
import './styles.css';
import DefaultDemoExport, { ${demoComponentNames.join(", ")} } from './demo';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from './components/ui/select';

const demoComponentNames = ${JSON.stringify(demoComponentNames)};
const DemoComponents = {
  ...{
    ${demoComponentNames.map((name) => `"${name}": ${name}`).join(",\n")}
  },
  ...DefaultDemoExport,
};

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const CurrentComponent = Object.values(DemoComponents)[currentIndex];
  const showSelect = demoComponentNames.length > 1;

  const handleSelect = (value) => {
    const index = demoComponentNames.indexOf(value);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="${theme}" enableSystem={false}>
      <RouterProvider>
        <div className="bg-background text-foreground">
          {showSelect && (
            <div className="absolute z-10 top-4 right-4">
              <Select onValueChange={handleSelect} defaultValue={demoComponentNames[0]} className="shadow">
                <SelectTrigger className="gap-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    ${demoComponentNames
                      .map(
                        (name) => `
                      <SelectItem key="${name}" value="${name}">
                        ${name.replace(/([A-Z])/g, " $1").trim()}
                      </SelectItem>
                      `,
                      )
                      .join("")}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="w-full">
            {CurrentComponent ? <CurrentComponent /> : <div>Component not found</div>}
          </div>
        </div>
      </RouterProvider>
    </ThemeProvider>
  );
}
`
    : `
import React, { useState } from 'react';
import { ThemeProvider } from './next-themes';
import { RouterProvider } from 'next/router';
import './styles.css';  // Import the compiled CSS
import DefaultDemoExport, { ${demoComponentNames.join(", ")} } from './demo';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from './components/ui/select';

const demoComponentNames = ${JSON.stringify(demoComponentNames)};
const DemoComponents = {
  ...{
    ${demoComponentNames.map((name) => `"${name}": ${name}`).join(",\n")}
  },
  ...DefaultDemoExport,
};


export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const CurrentComponent = Object.values(DemoComponents)[currentIndex];

  const showSelect = demoComponentNames.length > 1;

  const handleSelect = (value) => {
    const index = demoComponentNames.indexOf(value);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="${theme}" enableSystem={false}>
      <RouterProvider>
          <div className="relative flex items-center justify-center h-screen w-full m-auto p-16 bg-background text-foreground">
            <div className="absolute lab-bg inset-0 size-full bg-[radial-gradient(#00000021_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px]"></div>
            {showSelect && (
              <div className="absolute z-10 top-4 right-4">
                <Select onValueChange={handleSelect} defaultValue={demoComponentNames[0]} className="shadow">
                  <SelectTrigger className="gap-2">
                  <SelectValue />
                  </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    ${demoComponentNames
                      .map(
                        (name) => `
                      <SelectItem key="${name}" value="${name}">
                        ${name.replace(/([A-Z])/g, " $1").trim()}
                      </SelectItem>
                      `,
                      )
                      .join("")}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex w-full justify-center relative">
              {CurrentComponent ? <CurrentComponent /> : <div>Component not found</div>}
            </div>
          </div>
        </RouterProvider>
    </ThemeProvider>
  );
}
`
  const files = {
    "/styles.css": css,
    "/App.tsx": appTsxContent,
    "/next-themes.tsx": `
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: (theme: string) => {},
  resolvedTheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children, defaultTheme = 'light', enableSystem = false }) => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const resolvedTheme = theme === 'system' ? 'light' : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
`,
    "/hooks/use-media-query.tsx": `
import * as React from "react"

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}
`,
    "/hooks/use-click-outside.tsx": `
import * as React from "react"

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])

  return null
}

export default useClickOutside
`,
    "/components/ui/select.tsx": `
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
`,
    "/node_modules/next/package.json": `
   {
     "name": "next",
     "version": "latest",
     "main": "index.js"
   }
   `,
    "/node_modules/next/index.js": `
      export { default as Image } from './image';
      export { default as Link } from './link';
      export { useRouter, RouterProvider } from './router';
      export { default as Head } from './head';
      export { default as Script } from './script';
      export { default as dynamic } from './dynamic';
      export { Roboto } from './font';
      export { default as Document } from './document';
    `,
    "/node_modules/next/image.js": `
      import React from 'react';
      
      const Image = ({ src, alt, width, height, ...props }) => (
        <img src={src} alt={alt} width={width} height={height} {...props} />
      );
      
      export default Image;
    `,
    "/node_modules/next/link.js": `
      import React from 'react';
      
      const Link = ({ href, children, ...props }) => (
        <a href={href} {...props}>{children}</a>
      );
      
      export default Link;
    `,
    "/node_modules/next/head.js": `
      import React from 'react';
      
      const Head = ({ children }) => {
        return <div>{children}</div>;
      };
      
      export default Head;
    `,
    "/node_modules/next/script.js": `
      import React from 'react';
      
      const Script = ({ src, strategy, children, ...props }) => {
        return <script src={src} {...props}>{children}</script>;
      };
      
      export default Script;
    `,
    "/node_modules/next/router.js": `
      import React, { createContext, useContext } from 'react';
      
      const RouterContext = createContext({
        pathname: '/',
        push: (url) => {},
        replace: (url) => {},
      });
      
      export const useRouter = () => useContext(RouterContext);
      
      export const RouterProvider = ({ children }) => {
        const router = {
          pathname: '/',
          push: (url) => {
            console.log(\`Navigating to \${url}\`);
          },
          replace: (url) => {
            console.log(\`Replacing with \${url}\`);
          },
        };
        
        return (
          <RouterContext.Provider value={router}>
            {children}
          </RouterContext.Provider>
        );
      };
    `,
    "/node_modules/next/dynamic.js": `
      import React, { Suspense } from 'react';
      
      const dynamic = (importFunc, options = {}) => {
        const { ssr = true, loading: LoadingComponent = () => <div>Loading...</div> } = options;
        
        const LazyComponent = React.lazy(importFunc);
        
        return (props) => (
          <Suspense fallback={<LoadingComponent />}>
            <LazyComponent {...props} />
          </Suspense>
        );
      };
      
      export default dynamic;
    `,
    "/node_modules/next/font.js": `
      export const Roboto = {
        className: 'font-roboto',
      };
    `,
    "/node_modules/next/document.js": `
      import React from 'react';
      
      const Html = ({ children, ...props }) => <html {...props}>{children}</html>;
      const Head = ({ children }) => <head>{children}</head>;
      const Main = () => <div id="__next"></div>;
      const NextScript = () => <script />;
      
      export default function Document() {
        return (
          <Html>
            <Head />
            <body>
              <Main />
              <NextScript />
            </body>
          </Html>
        );
      }
    `,
    [`${relativeImportPath}/${componentSlug}.tsx`]: code,
    "/demo.tsx": demoCode,
    "/lib/utils.ts": `
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
    "/globals.css": customGlobalCss ?? defaultGlobalCss,
    "/tailwind.config.js": customTailwindConfig ?? defaultTailwindConfig,
    "/tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          esModuleInterop: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
      },
      null,
      2,
    ),
  }

  return files
}
