export type User = {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  active: boolean;
  createdAt: string;
};

export type PaymentRequest = {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  phone: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Ombi halijafanikiwa.");
  return payload;
}

export const registerUser = (data: { fullName: string; username: string; phone: string; password: string }) =>
  api<{ user: User }>("/api/register", { method: "POST", body: JSON.stringify(data) });

export const loginUser = (data: { username: string; password: string }) =>
  api<{ user: User }>("/api/login", { method: "POST", body: JSON.stringify(data) });

export const getMe = () => api<{ user: User | null }>("/api/me");
export const logoutUser = () => api<{ ok: true }>("/api/logout", { method: "POST" });

export const submitPaymentRequest = (phone: string) =>
  api<{ payment: PaymentRequest }>("/api/payment-request", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });

export const adminLogin = (username: string, password: string) =>
  api<{ ok: true }>("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });

export const adminLogout = () => api<{ ok: true }>("/api/admin/logout", { method: "POST" });

export const getAdminUsers = () => api<{ users: User[] }>("/api/admin/users");
export const getAdminPayments = () => api<{ payments: PaymentRequest[] }>("/api/admin/payments");
export const setUserActive = (id: string, active: boolean) =>
  api<{ user: User }>(`/api/admin/users/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
export const setPaymentStatus = (id: string, status: "approved" | "rejected") =>
  api<{ payment: PaymentRequest }>(`/api/admin/payments/${id}/${status}`, { method: "POST" });
