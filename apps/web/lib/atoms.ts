import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export const isClientAtom = atom(false)
export const isLoadingAtom = atom(true)
export const showLoadingAtom = atom(false)

export const componentStateAtom = atomWithStorage("componentState", {})
