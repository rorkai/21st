export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const media = window.matchMedia(query);
  return media.matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)")
}
