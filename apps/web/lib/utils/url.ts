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

  // Split URL and parameters
  const [baseUrl, queryString] = url.split("?")
  const params = new URLSearchParams(queryString || "")
  const currentVersion = params.get("v")

  if (currentVersion) {
    const nextVersion = parseInt(currentVersion) + 1
    params.set("v", nextVersion.toString())
  } else {
    params.set("v", initialVersion.toString())
  }
  const newQueryString = params.toString()
  return newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl || ""
}
