export const createDataUrl = (content: string, mimeType: string) => {
  const base64 = btoa(
    encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  )
  return `data:${mimeType};base64,${base64}`
}
