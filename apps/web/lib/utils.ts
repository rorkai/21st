import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPackageRunner(packageManager: string) {
  switch (packageManager) {
    case "pnpm":
      return "pnpm dlx"
    case "yarn":
      return "npx"
    case "bun":
      return "bunx --bun"
    case "npm":
    default:
      return "npx"
  }
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date)
}

export function appendQueryParam(url: string, param: string, value: string) {
  try {
    const urlObj = new URL(url)
    if (!urlObj.searchParams.has(param)) {
      urlObj.searchParams.append(param, value)
    }
    return urlObj.toString()
  } catch (e) {
    return url
  }
}
