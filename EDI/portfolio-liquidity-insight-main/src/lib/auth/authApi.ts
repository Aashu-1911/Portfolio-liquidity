import type { AuthResponse, MeResponse } from "./types";

const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE || "/api";

const requestJson = async <T>(input: string, init?: RequestInit): Promise<T> => {
  try {
    const res = await fetch(input, init);

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    return res.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Unable to reach auth server. Please ensure backend is running.");
    }
    throw error;
  }
};

const parseError = async (res: Response) => {
  try {
    const data = await res.json();
    return data.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

export const registerApi = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  return requestJson<AuthResponse>(`${AUTH_API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const loginApi = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  return requestJson<AuthResponse>(`${AUTH_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const meApi = async (token: string): Promise<MeResponse> => {
  return requestJson<MeResponse>(`${AUTH_API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
