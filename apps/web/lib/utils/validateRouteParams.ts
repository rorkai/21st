export function validateRouteParams(
  params: Record<string, string | undefined>,
) {
  return !Object.values(params).some(
    (value) => !value || value === "undefined" || value === "null",
  )
}
