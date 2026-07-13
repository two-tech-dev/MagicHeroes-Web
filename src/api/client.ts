export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': crypto.randomUUID(), ...init.headers },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new ApiError('Không thể xử lý yêu cầu. Vui lòng thử lại.', response.status);
  return response.json() as Promise<T>;
}
