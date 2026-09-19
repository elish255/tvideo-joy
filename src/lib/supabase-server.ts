const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function endpoint(table: string, query = "") {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL haijawekwa kwenye environment.");
  return `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

async function request<T>(table: string, init: RequestInit = {}, query = ""): Promise<T> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY haijawekwa kwenye environment.");
  }

  const response = await fetch(endpoint(table, query), {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data
      ? String((data as { message: unknown }).message)
      : typeof data === "string" ? data : "Supabase request imeshindikana.";
    throw new Error(message);
  }

  return data as T;
}

export const supabaseGet = <T>(table: string, query: string) =>
  request<T>(table, { method: "GET" }, query);

export const supabaseInsert = <T>(table: string, value: unknown) =>
  request<T>(table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  });

export const supabaseUpdate = <T>(table: string, query: string, value: unknown) =>
  request<T>(table, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  }, query);

export const supabaseDelete = (table: string, query: string) =>
  request<unknown>(table, { method: "DELETE" }, query);
