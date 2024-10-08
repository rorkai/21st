import { atom } from "jotai"

// Атомы для общего состояния
export const isSlugManuallyEditedAtom = atom<boolean>(false)
export const slugCheckingAtom = atom<boolean>(false)
export const slugErrorAtom = atom<string | null>(null)
export const slugAvailableAtom = atom<boolean | null>(null)
export const demoCodeErrorAtom = atom<string | null>(null)
export const internalDependenciesAtom = atom<Record<string, string>>({})
// Добавьте другие атомы по необходимости
