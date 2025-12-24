import { API_BASE } from "@/lib/api";
import { supabaseClient } from "@/lib/supabaseClient";

const ACCOUNT_KEY = "wa_account_id";

export function getSelectedWaAccountId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCOUNT_KEY);
}

export function setSelectedWaAccountId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNT_KEY, id);
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("No active session");
  return token;
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  waAccountId?: string | null;
  isForm?: boolean;
};

async function authFetch(path: string, options: FetchOptions = {}) {
  const token = await getAccessToken();
  const waAccountId = options.waAccountId ?? getSelectedWaAccountId();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (waAccountId) {
    headers["x-wa-account-id"] = waAccountId;
  }

  let body: BodyInit | undefined = undefined;
  if (options.isForm && options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body,
  });

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = parsed?.error || parsed?.message || text || "Request failed";
    throw new Error(message);
  }

  return parsed;
}

export async function backendPostJson<T>(
  path: string,
  body: unknown,
  waAccountId?: string | null
): Promise<T> {
  return authFetch(path, { method: "POST", body, waAccountId });
}

export async function backendPostForm<T>(
  path: string,
  formData: FormData,
  waAccountId?: string | null
): Promise<T> {
  return authFetch(path, { method: "POST", body: formData, isForm: true, waAccountId });
}

export async function backendGet<T>(
  path: string,
  waAccountId?: string | null
): Promise<T> {
  return authFetch(path, { method: "GET", waAccountId });
}

