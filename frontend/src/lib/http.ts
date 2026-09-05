const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface FastApiValidationError {
  msg: string
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object' || !('detail' in body)) return fallback

  const detail = (body as { detail: unknown }).detail
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => (entry && typeof entry === 'object' && 'msg' in entry ? (entry as FastApiValidationError).msg : null))
      .filter((msg): msg is string => !!msg)
    if (messages.length) return messages.join(', ')
  }

  return fallback
}

/** Builds the `x-user-role` header the backend uses to authorize list/write endpoints. */
export function roleHeaders(role?: string): Record<string, string> | undefined {
  return role ? { 'x-user-role': role } : undefined
}

/** Builds the headers the customer-portal endpoints use to scope results to one customer. */
export function portalHeaders(role?: string, email?: string): Record<string, string> | undefined {
  const headers: Record<string, string> = {}
  if (role) headers['x-user-role'] = role
  if (email) headers['x-customer-email'] = email
  return Object.keys(headers).length ? headers : undefined
}

async function handleResponse<TResponse>(res: Response): Promise<TResponse> {
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(data, 'Request failed'), res.status)
  }

  return data as TResponse
}

/** Thin fetch wrapper for the real Urban Furniture Accounting backend (FastAPI). */
export async function apiGet<TResponse>(path: string, headers?: Record<string, string>): Promise<TResponse> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  return handleResponse<TResponse>(res)
}

export async function apiPost<TResponse>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<TResponse> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  return handleResponse<TResponse>(res)
}
