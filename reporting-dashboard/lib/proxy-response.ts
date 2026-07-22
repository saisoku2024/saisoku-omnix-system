export async function readProxyResponse(response: Response, fallbackLabel: string) {
  const text = await response.text()
  if (!text.trim()) {
    return { detail: `${fallbackLabel} failed with HTTP ${response.status}` }
  }

  try {
    return JSON.parse(text)
  } catch {
    return { detail: `${fallbackLabel} failed with HTTP ${response.status}: ${text.slice(0, 500)}` }
  }
}
