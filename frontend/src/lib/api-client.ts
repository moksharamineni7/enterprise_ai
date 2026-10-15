const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return `${window.location.origin}/api/v1`;
  }
  return 'https://enterprise-ai-1.onrender.com/api/v1';
};

export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('nexusflow_token') || 'demo-admin-token';
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if FormData is used
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${getBaseUrl()}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    const errorInfo = json.error || {};
    throw new ApiError(
      errorInfo.message || `Request failed with status ${response.status}`,
      errorInfo.code || `HTTP_${response.status}`,
      errorInfo.details
    );
  }

  return json.data as T;
}
