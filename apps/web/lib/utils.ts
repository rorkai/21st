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
