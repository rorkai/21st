/**
 * Adds or updates version parameter in URL
 * @param url - URL to add version to
 * @param initialVersion - Initial version number (defaults to 1)
 * @returns URL with version parameter
 */
export const addVersionToUrl = (
  url: string | null | undefined,
  initialVersion: number = 1,
): string => {
  if (!url) return ""

  const urlObj = new URL(url)
  const vParam = urlObj.searchParams.get("v")

  if (vParam) {
    const nextVersion = parseInt(vParam) + 1
    urlObj.searchParams.set("v", nextVersion.toString())
  } else {
    urlObj.searchParams.set("v", initialVersion.toString())
  }

  return urlObj.toString()
}
