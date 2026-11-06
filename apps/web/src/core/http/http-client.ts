const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

interface ErrorBody {
  errors?: Array<{ code: string; message: string }>;
}

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (error) {
    if (init?.signal?.aborted) {
      throw error;
    }
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', undefined, { cause: error });
  }

  if (!response.ok) {
    const body: ErrorBody = await response.json().catch(() => ({}));
    const error = body.errors?.[0];
    throw new ApiError(error?.message ?? `A requisição falhou (status ${response.status}).`, error?.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}
