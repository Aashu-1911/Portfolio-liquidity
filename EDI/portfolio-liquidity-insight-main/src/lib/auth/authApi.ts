import type { AuthResponse, MeResponse } from "./types";

const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE || "http://localhost:5001/api";

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
  const res = await fetch(`${AUTH_API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
};

export const loginApi = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await fetch(`${AUTH_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
};

export const meApi = async (token: string): Promise<MeResponse> => {
  const res = await fetch(`${AUTH_API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
};
