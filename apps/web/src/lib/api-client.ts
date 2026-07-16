const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    const headers: Record<string, string> = {};

    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(data.error || 'Request failed', res.status, data.details);
    }

    return data;
  }

  get<T>(path: string, options?: RequestInit) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>('POST', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestInit) {
    return this.request<T>('DELETE', path, undefined, options);
  }

  async login(email: string, password: string) {
    return this.post<{ success: boolean; data: { user: any } }>('/auth/login', { email, password });
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    return this.post<{ success: boolean; data: { user: any } }>('/auth/register', { email, password, firstName, lastName });
  }

  async logout() {
    return this.post<{ success: boolean; data: any }>('/auth/logout');
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();
