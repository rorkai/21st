import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Общие атомы
export const isClientAtom = atom(false);
export const isLoadingAtom = atom(true);
export const showLoadingAtom = atom(false);

// Атомы для ComponentForm
export const slugAvailableAtom = atom<boolean | null>(null);
export const slugCheckingAtom = atom(false);
export const slugErrorAtom = atom<string | null>(null);
export const demoCodeErrorAtom = atom<string | null>(null);
export const parsedDependenciesAtom = atom<Record<string, string>>({});
export const parsedComponentNamesAtom = atom<string[]>([]);
export const parsedDemoDependenciesAtom = atom<Record<string, string>>({});
export const internalDependenciesAtom = atom<Record<string, string>>({});
export const importsToRemoveAtom = atom<string[]>([]);
export const parsedDemoComponentNameAtom = atom('');

// Атомы для ComponentPreview
export const codeAtom = atom('');
export const demoCodeAtom = atom('');
export const dependenciesAtom = atom<Record<string, string>>({});
export const demoDependenciesAtom = atom<Record<string, string>>({});
export const internalDependenciesCodeAtom = atom<Record<string, string>>({});
export const showCodeAtom = atom(false);
export const isSharingAtom = atom(false);
export const shareButtonTextAtom = atom('Share');

// Атомы для SandpackProviderClient
export const copiedAtom = atom(false);
export const codeCopiedAtom = atom(false);
export const isHoveringAtom = atom(false);
export const isDebugAtom = atom(false);
export const activeFileAtom = atom('');
export const isComponentsLoadedAtom = atom(false);

// Атом для хранения состояния компонента (можно использовать для кэширования)
export const componentStateAtom = atomWithStorage('componentState', {});