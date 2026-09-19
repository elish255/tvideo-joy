import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { supabaseConfigured, supabaseDelete, supabaseGet, supabaseInsert, supabaseUpdate } from "./lib/supabase-server";

type ServerEntry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response };
type User = { id: string; fullName: string; username: string; phone: string; passwordHash: string; active: boolean; createdAt: string };
type Payment = { id: string; userId: string; phone: string; amount: number; status: "pending" | "approved" | "rejected"; createdAt: string };
type Session = { token: string; userId: string; createdAt: string };

type DbUser = { id: string; full_name: string; username: string; phone: string; password_hash: string; active: boolean; created_at: string };
type DbPayment = { id: string; user_id: string; phone: string; amount: number; status: "pending" | "approved" | "rejected"; created_at: string };
type DbSession = { token: string; user_id: string; created_at: string };

const SESSION_COOKIE = "tvideo_session";
const ADMIN_COOKIE = "tvideo_admin";
const ACTIVATION_FEE = 16000;
const LIPA_NAMBA = "251161660";
const BUSINESS_NAME = "ASSERT BRIDGE";
const SECURE_COOKIE = process.env.NODE_ENV === "production" ? "; Secure" : "";
let serverEntryPromise: Promise<ServerEntry> | undefined;

function hashPassword(password: string) {
  const salt = randomUUID().replaceAll("-", "");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function cookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

function publicUser(user: User) {
  return { id: user.id, fullName: user.fullName, username: user.username, phone: user.phone, active: user.active, createdAt: user.createdAt };
}

function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${SECURE_COOKIE}; Max-Age=2592000`;
}

function adminCookie(token: string) {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${SECURE_COOKIE}; Max-Age=43200`;
}

function clearCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax${SECURE_COOKIE}; Max-Age=0`;
}

async function body(request: Request) {
  try { return await request.json() as Record<string, unknown>; } catch { return {}; }
}

function adminToken() {
  const username = process.env.TVIDEO_ADMIN_USERNAME;
  const password = process.env.TVIDEO_ADMIN_PASSWORD;
  if (!username || !password) return "";
  return createHmac("sha256", password).update(username).digest("hex");
}

function requireAdmin(request: Request) {
  const supplied = cookie(request, ADMIN_COOKIE);
  const expected = adminToken();
  return Boolean(expected && supplied && supplied === expected);
}

function mapUser(row: DbUser): User { return { id: row.id, fullName: row.full_name, username: row.username, phone: row.phone, passwordHash: row.password_hash, active: row.active, createdAt: row.created_at }; }
function mapPayment(row: DbPayment): Payment { return { id: row.id, userId: row.user_id, phone: row.phone, amount: row.amount, status: row.status, createdAt: row.created_at }; }
function mapSession(row: DbSession): Session { return { token: row.token, userId: row.user_id, createdAt: row.created_at }; }

async function findUserById(id: string) {
  const rows = await supabaseGet<DbUser[]>("tvideo_users", `id=eq.${encodeURIComponent(id)}&select=*`);
  return rows[0] ? mapUser(rows[0]) : undefined;
}

async function findUserByUsername(username: string) {
  const rows = await supabaseGet<DbUser[]>("tvideo_users", `username=eq.${encodeURIComponent(username)}&select=*`);
  return rows[0] ? mapUser(rows[0]) : undefined;
}

async function currentUser(request: Request) {
  const token = cookie(request, SESSION_COOKIE);
  if (!token) return undefined;
  const sessions = await supabaseGet<DbSession[]>("tvideo_sessions", `token=eq.${encodeURIComponent(token)}&select=*`);
  const session = sessions[0] ? mapSession(sessions[0]) : undefined;
  if (!session) return undefined;
  return findUserById(session.userId);
}

async function handleApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;
  if (!supabaseConfigured()) {
    return json({ error: "Supabase haijaunganishwa. Weka SUPABASE_URL na SUPABASE_SERVICE_ROLE_KEY kwenye Vercel Environment Variables." }, 503);
  }

  const path = url.pathname;

  if (path === "/api/register" && request.method === "POST") {
    const b = await body(request);
    const fullName = String(b.fullName ?? "").trim();
    const username = String(b.username ?? "").trim().toLowerCase();
    const phone = String(b.phone ?? "").trim();
    const password = String(b.password ?? "");
    if (!fullName || !username || !phone || password.length < 6) return json({ error: "Jaza taarifa zote; password iwe na angalau herufi/namba 6." }, 400);
    if (!/^[a-z0-9_.-]{3,30}$/.test(username)) return json({ error: "Username itumie herufi, namba, _, . au - (3-30)." }, 400);
    if (await findUserByUsername(username)) return json({ error: "Username tayari imetumika." }, 409);

    const now = new Date().toISOString();
    const inserted = await supabaseInsert<DbUser[]>("tvideo_users", {
      id: randomUUID(), full_name: fullName, username, phone, password_hash: hashPassword(password), active: false, created_at: now,
    });
    const user = inserted[0] ? mapUser(inserted[0]) : undefined;
    if (!user) return json({ error: "User hakusajiliwa." }, 500);

    const token = randomUUID();
    await supabaseInsert<Session[]>("tvideo_sessions", { token, user_id: user.id, created_at: now });
    return json({ user: publicUser(user) }, 201, { "set-cookie": sessionCookie(token) });
  }

  if (path === "/api/login" && request.method === "POST") {
    const b = await body(request);
    const username = String(b.username ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const user = await findUserByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) return json({ error: "Username au Password si sahihi." }, 401);

    const token = randomUUID();
    await supabaseInsert<Session[]>("tvideo_sessions", { token, user_id: user.id, created_at: new Date().toISOString() });
    return json({ user: publicUser(user) }, 200, { "set-cookie": sessionCookie(token) });
  }

  if (path === "/api/me" && request.method === "GET") {
    const user = await currentUser(request);
    return json({ user: user ? publicUser(user) : null });
  }

  if (path === "/api/logout" && request.method === "POST") {
    const token = cookie(request, SESSION_COOKIE);
    if (token) await supabaseDelete("tvideo_sessions", `token=eq.${encodeURIComponent(token)}`);
    return json({ ok: true }, 200, { "set-cookie": clearCookie(SESSION_COOKIE) });
  }

  if (path === "/api/payment-request" && request.method === "POST") {
    const user = await currentUser(request);
    if (!user) return json({ error: "Log in kwanza." }, 401);
    if (user.active) return json({ error: "Account yako tayari ime-activate." }, 400);

    const b = await body(request);
    const phone = String(b.phone ?? "").trim();
    if (!phone) return json({ error: "Weka namba ya simu uliyolipia." }, 400);

    const pendingRows = await supabaseGet<DbPayment[]>("tvideo_payments", `user_id=eq.${encodeURIComponent(user.id)}&status=eq.pending&order=created_at.desc&limit=1`);
    const pending = pendingRows[0] ? mapPayment(pendingRows[0]) : undefined;
    if (pending) return json({ payment: { ...pending, username: user.username, fullName: user.fullName } });

    const inserted = await supabaseInsert<DbPayment[]>("tvideo_payments", {
      id: randomUUID(), user_id: user.id, phone, amount: ACTIVATION_FEE, status: "pending", created_at: new Date().toISOString(),
    });
    const payment = inserted[0] ? mapPayment(inserted[0]) : undefined;
    if (!payment) return json({ error: "Payment request haikuundwa." }, 500);
    return json({ payment: { ...payment, username: user.username, fullName: user.fullName } }, 201);
  }

  if (path === "/api/admin/login" && request.method === "POST") {
    const b = await body(request);
    const username = String(b.username ?? "");
    const password = String(b.password ?? "");
    if (!process.env.TVIDEO_ADMIN_USERNAME || !process.env.TVIDEO_ADMIN_PASSWORD) return json({ error: "Admin credentials hazijawekwa kwenye environment." }, 503);
    if (username !== process.env.TVIDEO_ADMIN_USERNAME || password !== process.env.TVIDEO_ADMIN_PASSWORD) return json({ error: "Admin username au password si sahihi." }, 401);
    return json({ ok: true }, 200, { "set-cookie": adminCookie(adminToken()) });
  }

  if (path === "/api/admin/logout" && request.method === "POST") return json({ ok: true }, 200, { "set-cookie": clearCookie(ADMIN_COOKIE) });

  if (path === "/api/admin/users" && request.method === "GET") {
    if (!requireAdmin(request)) return json({ error: "Huna ruhusa." }, 401);
    const users = await supabaseGet<DbUser[]>("tvideo_users", "select=*&order=created_at.desc");
    return json({ users: users.map(row => publicUser(mapUser(row))) });
  }

  if (path === "/api/admin/payments" && request.method === "GET") {
    if (!requireAdmin(request)) return json({ error: "Huna ruhusa." }, 401);
    const [payments, users] = await Promise.all([
      supabaseGet<DbPayment[]>("tvideo_payments", "select=*&order=created_at.desc"),
      supabaseGet<DbUser[]>("tvideo_users", "select=id,full_name,username"),
    ]);
    const byId = new Map(users.map(u => [u.id, u]));
    return json({ payments: payments.map(row => { const p = mapPayment(row); const u = byId.get(p.userId); return { ...p, username: u?.username ?? "", fullName: u?.full_name ?? "" }; }) });
  }

  const userAction = path.match(/^\/api\/admin\/users\/([^/]+)\/(activate|deactivate)$/);
  if (userAction && request.method === "POST") {
    if (!requireAdmin(request)) return json({ error: "Huna ruhusa." }, 401);
    const user = await findUserById(userAction[1]);
    if (!user) return json({ error: "User hajapatikana." }, 404);
    const active = userAction[2] === "activate";
    const updated = await supabaseUpdate<DbUser[]>("tvideo_users", `id=eq.${encodeURIComponent(user.id)}`, { active });
    const next = updated[0] ? mapUser(updated[0]) : { ...user, active };
    return json({ user: publicUser(next) });
  }

  const paymentAction = path.match(/^\/api\/admin\/payments\/([^/]+)\/(approved|rejected)$/);
  if (paymentAction && request.method === "POST") {
    if (!requireAdmin(request)) return json({ error: "Huna ruhusa." }, 401);
    const id = paymentAction[1];
    const status = paymentAction[2] as Payment["status"];
    const rows = await supabaseGet<DbPayment[]>("tvideo_payments", `id=eq.${encodeURIComponent(id)}&select=*`);
    const payment = rows[0] ? mapPayment(rows[0]) : undefined;
    if (!payment) return json({ error: "Payment request haijapatikana." }, 404);

    const updated = await supabaseUpdate<DbPayment[]>("tvideo_payments", `id=eq.${encodeURIComponent(id)}`, { status });
    if (status === "approved") await supabaseUpdate<DbUser[]>("tvideo_users", `id=eq.${encodeURIComponent(payment.userId)}`, { active: true });
    const user = await findUserById(payment.userId);
    const updatedPayment = updated[0] ? mapPayment(updated[0]) : { ...payment, status };
    return json({ payment: { ...updatedPayment, username: user?.username ?? "", fullName: user?.fullName ?? "" } });
  }

  if (path === "/api/payment-info" && request.method === "GET") return json({ amount: ACTIVATION_FEE, lipaNamba: LIPA_NAMBA, businessName: BUSINESS_NAME });

  return json({ error: "API route haijapatikana." }, 404);
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) serverEntryPromise = import("@tanstack/react-start/server-entry").then(m => (m.default ?? m) as ServerEntry);
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const bodyText = await response.clone().text();
  if (!isH3SwallowedErrorBody(bodyText)) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${bodyText}`));
  return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
}

function isH3SwallowedErrorBody(bodyText: string) {
  try {
    const payload = JSON.parse(bodyText) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch { return false; }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const api = await handleApi(request);
      if (api) return api;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return json({ error: error instanceof Error ? error.message : "Server error." }, 500);
    }
  },
};
