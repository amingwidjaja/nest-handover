export async function parseApiErrorBody(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const j = JSON.parse(text) as { error?: string }
    return j.error || text || `HTTP ${res.status}`
  } catch {
    return text || `HTTP ${res.status}`
  }
}
