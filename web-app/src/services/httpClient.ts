/**
 * FINA-ENTERPRISE HTTP Transport Client
 * 
 * Standar Google Engineering & SRE:
 * - Hexagonal Architecture / Port & Adapter
 * - Centralized Authentication Bearer Token Injection
 * - Graceful Network & Offline Handling
 * - Strict Type Safety & Telemetry
 */

export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    // Baca dari parameter, atau environment variable VITE_API_BASE_URL (misal di Vercel), fallback ke string kosong (relative proxy)
    const envBaseUrl = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_API_BASE_URL as string | undefined) : '';
    this.baseUrl = baseUrl || (envBaseUrl ?? '');
  }

  getAuthToken(): string | null {
    return sessionStorage.getItem('fina_auth_token');
  }

  setAuthToken(token: string): void {
    sessionStorage.setItem('fina_auth_token', token);
  }

  clearAuthToken(): void {
    sessionStorage.removeItem('fina_auth_token');
    sessionStorage.removeItem('fina_auth_user');
  }

  private getHeaders(hasBody: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Eksekutor request generik dengan penanganan error terstandar
   */
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    fallbackValue?: T
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const hasBody = Boolean(options.body);

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(hasBody),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Jika disediakan fallback value (misal [] atau null), kembalikan tanpa melempar error
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }

        const errData = await response.json().catch(() => ({}));
        const message = errData.detail || `Permintaan HTTP gagal (${response.status}: ${response.statusText})`;
        throw new Error(message);
      }

      // Jika response 204 No Content
      if (response.status === 204) {
        return (true as unknown) as T;
      }

      return await response.json();
    } catch (err: any) {
      // Deteksi kegagalan koneksi jaringan (backend offline)
      if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        throw new Error(
          'Gagal terhubung ke server backend (Port 8000 offline). Pastikan server backend FastAPI sedang berjalan.'
        );
      }
      throw err;
    }
  }

  get<T>(endpoint: string, fallbackValue?: T): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, fallbackValue);
  }

  post<T>(endpoint: string, body?: any, fallbackValue?: T): Promise<T> {
    return this.request<T>(
      endpoint, 
      { 
        method: 'POST', 
        body: body !== undefined ? JSON.stringify(body) : undefined 
      }, 
      fallbackValue
    );
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(
      endpoint, 
      { 
        method: 'PUT', 
        body: body !== undefined ? JSON.stringify(body) : undefined 
      }
    );
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(
      endpoint, 
      { 
        method: 'PATCH', 
        body: body !== undefined ? JSON.stringify(body) : undefined 
      }
    );
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message = errData.detail || `Permintaan HTTP gagal (${response.status}: ${response.statusText})`;
      throw new Error(message);
    }
    return await response.json();
  }
}

export const httpClient = new HttpClient();
