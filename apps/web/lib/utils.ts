import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPackageRunner(packageManager: string) {
  if (packageManager === "pnpm") return "pnpm dlx"
  if (packageManager === "bun") return "bunx"
  return "npx"
}

export function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item)
}

export function deepMerge<T>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        deepMerge(target[key] as T[Extract<keyof T, string>], source[key] as Partial<T[Extract<keyof T, string>]>)
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return deepMerge(target, ...sources)
}
