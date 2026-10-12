// ─────────────────────────────────────────────────────────────
//  API Client — thin fetch wrapper with error handling
// ─────────────────────────────────────────────────────────────

const configuredBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const BASE = /^https?:\/\//i.test(configuredBase) ? configuredBase : `https://${configuredBase}`;

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get:   <T>(path: string)                      => request<T>(path),
  post:  <T>(path: string, body: unknown)        => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown)        => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
