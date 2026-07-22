export async function throwFetchError(response: Response, fallback = "Request failed") {
  let message = fallback

  try {
    const payload = (await response.json()) as {
      detail?: unknown
      error?: unknown
      message?: unknown
    }
    const detail = payload.detail ?? payload.error ?? payload.message
    if (typeof detail === "string" && detail.trim()) {
      message = detail
    }
  } catch {
    // Keep the fallback message if the response body is empty or not JSON.
  }

  throw new Error(message)
}
