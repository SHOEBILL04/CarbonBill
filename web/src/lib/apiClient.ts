export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  activeOrgId: string;
  activeOrgName: string;
  role?: string;
  memberships: Array<{ orgId: string; orgName: string; role?: string }>;
}

const TOKEN_KEY = 'carbonbill_token';
const USER_KEY = 'carbonbill_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const json = localStorage.getItem(USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include' // Send refresh cookie
  });

  if (response.status === 401) {
    // Attempt token refresh
    const refreshRes = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (refreshRes.ok) {
      const refreshedData = await refreshRes.json();
      localStorage.setItem(TOKEN_KEY, refreshedData.accessToken);
      // Retry original request with new token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${refreshedData.accessToken}`;
      const retryResponse = await fetch(endpoint, {
        ...options,
        headers,
        credentials: 'include'
      });
      if (!retryResponse.ok) {
        throw new Error(`API Error: ${retryResponse.statusText}`);
      }
      return retryResponse.json();
    } else {
      clearSession();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || errorBody.title || `API Request failed with status ${response.status}`);
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string) => apiFetch<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
};

export interface TeamUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAtUtc: string;
}

export async function fetchTeamUsers(): Promise<TeamUser[]> {
  try {
    return await apiFetch<TeamUser[]>('/api/v1/auth/users');
  } catch (err) {
    console.warn('Failed to fetch team users:', err);
    return [];
  }
}

export async function updateMyProfile(payload: {
  userId?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
}): Promise<{ success: boolean; fullName?: string; role?: string }> {
  return await apiFetch('/api/v1/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ success: boolean; userId: string; role: string }> {
  return await apiFetch(`/api/v1/auth/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}
