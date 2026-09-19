import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

type ServerEntry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response };
type User = { id: string; fullName: string; username: string; phone: string; passwordHash: string; active: boolean; createdAt: string };
type Payment = { id: string; userId: string; phone: string; amount: number; status: "pending" | "approved" | "rejected"; createdAt: string };
type Session = { token: string; userId: string; createdAt: string };
type Db = { users: User[]; payments: Payment[]; sessions: Session[] };

const DB_FILE = join(process.cwd(), "data", "tvideo-db.json");
const SESSION_COOKIE = "tvideo_session";
const ADMIN_COOKIE = "tvideo_admin";
const ACTIVATION_FEE = 16000;
const LIPA_NAMBA = "251161660";
const BUSINESS_NAME = "ASSERT BRIDGE";
let serverEntryPromise: Promise<ServerEntry> | undefined;

function emptyDb(): Db { return { users: [], payments: [], sessions: [] }; }
function readDb(): Db {
  try { if (!existsSync(DB_FILE)) return emptyDb(); return JSON.parse(readFileSync(DB_FILE, "utf8")) as Db; } catch { return emptyDb(); }
}
function saveDb(db: Db) { mkdirSync(dirname(DB_FILE), { recursive: true }); writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function hashPassword(password: string) { const salt = randomUUID().replaceAll("-", ""); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password: string, stored: string) { try { const [salt, hash] = stored.split(":"); const actual = scryptSync(password, salt, 64); const expected = Buffer.from(hash, "hex"); return expected.length === actual.length && timingSafeEqual(expected, actual); } catch { return false; } }
function cookie(request: Request, name: string) { return request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith(`${name}=`))?.slice(name.length+1) ?? ""; }
function json(data: unknown, status = 200, extra: Record<string,string> = {}) { return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...extra } }); }
function publicUser(user: User) { return { id:user.id, fullName:user.fullName, username:user.username, phone:user.phone, active:user.active, createdAt:user.createdAt }; }
function currentUser(request: Request, db: Db) { const token=cookie(request, SESSION_COOKIE); const session=db.sessions.find(s=>s.token===token); return session ? db.users.find(u=>u.id===session.userId) : undefined; }
function requireAdmin(request: Request) { return cookie(request, ADMIN_COOKIE) === adminToken(); }
function adminToken() { const username=process.env.TVIDEO_ADMIN_USERNAME; const password=process.env.TVIDEO_ADMIN_PASSWORD; if(!username||!password) return ""; return createHmac("sha256", password).update(username).digest("hex"); }
function sessionCookie(token: string) { return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`; }
function clearCookie(name: string) { return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`; }
async function body(request: Request) { try { return await request.json() as Record<string, unknown>; } catch { return {}; } }

async function handleApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url); if(!url.pathname.startsWith("/api/")) return null;
  const db=readDb(); const path=url.pathname;

  if(path==="/api/register" && request.method==="POST"){
    const b=await body(request); const fullName=String(b.fullName??"").trim(); const username=String(b.username??"").trim().toLowerCase(); const phone=String(b.phone??"").trim(); const password=String(b.password??"");
    if(!fullName||!username||!phone||password.length<6) return json({error:"Jaza taarifa zote; password iwe na angalau herufi/namba 6."},400);
    if(!/^[a-z0-9_.-]{3,30}$/.test(username)) return json({error:"Username itumie herufi, namba, _, . au - (3-30)."},400);
    if(db.users.some(u=>u.username===username)) return json({error:"Username tayari imetumika."},409);
    const user:User={id:randomUUID(),fullName,username,phone,passwordHash:hashPassword(password),active:false,createdAt:new Date().toISOString()}; db.users.push(user); saveDb(db);
    const token=randomUUID(); db.sessions.push({token,userId:user.id,createdAt:new Date().toISOString()}); saveDb(db);
    return json({user:publicUser(user) },201,{"set-cookie":sessionCookie(token)});
  }
  if(path==="/api/login" && request.method==="POST"){
    const b=await body(request); const username=String(b.username??"").trim().toLowerCase(); const password=String(b.password??""); const user=db.users.find(u=>u.username===username);
    if(!user||!verifyPassword(password,user.passwordHash)) return json({error:"Username au Password si sahihi."},401);
    const token=randomUUID(); db.sessions.push({token,userId:user.id,createdAt:new Date().toISOString()}); saveDb(db); return json({user:publicUser(user) },200,{"set-cookie":sessionCookie(token)});
  }
  if(path==="/api/me" && request.method==="GET"){ const user=currentUser(request,db); return json({user:user?publicUser(user):null}); }
  if(path==="/api/logout" && request.method==="POST") { const token=cookie(request,SESSION_COOKIE); db.sessions=db.sessions.filter(s=>s.token!==token); saveDb(db); return json({ok:true},200,{"set-cookie":clearCookie(SESSION_COOKIE)}); }
  if(path==="/api/payment-request" && request.method==="POST"){
    const user=currentUser(request,db); if(!user) return json({error:"Log in kwanza."},401); if(user.active) return json({error:"Account yako tayari ime-activate."},400);
    const b=await body(request); const phone=String(b.phone??"").trim(); if(!phone) return json({error:"Weka namba ya simu uliyolipia."},400);
    const pending=db.payments.find(p=>p.userId===user.id&&p.status==="pending"); if(pending) return json({payment:{...pending,username:user.username,fullName:user.fullName}},200);
    const payment:Payment={id:randomUUID(),userId:user.id,phone,amount:ACTIVATION_FEE,status:"pending",createdAt:new Date().toISOString()}; db.payments.unshift(payment); saveDb(db);
    return json({payment:{...payment,username:user.username,fullName:user.fullName}} ,201);
  }
  if(path==="/api/admin/login" && request.method==="POST"){
    const b=await body(request); const username=String(b.username??""); const password=String(b.password??""); if(!process.env.TVIDEO_ADMIN_USERNAME||!process.env.TVIDEO_ADMIN_PASSWORD) return json({error:"Admin credentials hazijawekwa kwenye environment."},503);
    if(username!==process.env.TVIDEO_ADMIN_USERNAME||password!==process.env.TVIDEO_ADMIN_PASSWORD) return json({error:"Admin username au password si sahihi."},401);
    return json({ok:true},200,{"set-cookie":`${ADMIN_COOKIE}=${adminToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`});
  }
  if(path==="/api/admin/logout" && request.method==="POST") return json({ok:true},200,{"set-cookie":clearCookie(ADMIN_COOKIE)});
  if(path==="/api/admin/users" && request.method==="GET") { if(!requireAdmin(request)) return json({error:"Huna ruhusa."},401); return json({users:db.users.map(publicUser)}); }
  if(path==="/api/admin/payments" && request.method==="GET") { if(!requireAdmin(request)) return json({error:"Huna ruhusa."},401); return json({payments:db.payments.map(p=>{const u=db.users.find(x=>x.id===p.userId);return {...p,username:u?.username??"",fullName:u?.fullName??""};})}); }
  const userAction=path.match(/^\/api\/admin\/users\/([^/]+)\/(activate|deactivate)$/); if(userAction&&request.method==="POST"){ if(!requireAdmin(request))return json({error:"Huna ruhusa."},401); const user=db.users.find(u=>u.id===userAction[1]);if(!user)return json({error:"User hajapatikana."},404);user.active=userAction[2]==="activate";saveDb(db);return json({user:publicUser(user)}); }
  const paymentAction=path.match(/^\/api\/admin\/payments\/([^/]+)\/(approved|rejected)$/); if(paymentAction&&request.method==="POST"){ if(!requireAdmin(request))return json({error:"Huna ruhusa."},401); const p=db.payments.find(x=>x.id===paymentAction[1]);if(!p)return json({error:"Payment request haijapatikana."},404);p.status=paymentAction[2] as Payment["status"];if(p.status==="approved"){const u=db.users.find(x=>x.id===p.userId);if(u)u.active=true;}saveDb(db);const u=db.users.find(x=>x.id===p.userId);return json({payment:{...p,username:u?.username??"",fullName:u?.fullName??""}});}
  if(path==="/api/payment-info" && request.method==="GET") return json({amount:ACTIVATION_FEE,lipaNamba:LIPA_NAMBA,businessName:BUSINESS_NAME});
  return json({error:"API route haijapatikana."},404);
}

async function getServerEntry(): Promise<ServerEntry> { if(!serverEntryPromise) serverEntryPromise=import("@tanstack/react-start/server-entry").then(m=>(m.default??m) as ServerEntry); return serverEntryPromise; }
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> { if(response.status<500)return response; const contentType=response.headers.get("content-type")??"";if(!contentType.includes("application/json"))return response;const bodyText=await response.clone().text();if(!isH3SwallowedErrorBody(bodyText))return response;console.error(consumeLastCapturedError()??new Error(`h3 swallowed SSR error: ${bodyText}`));return new Response(renderErrorPage(),{status:500,headers:{"content-type":"text/html; charset=utf-8"}}); }
function isH3SwallowedErrorBody(bodyText:string){try{const payload=JSON.parse(bodyText) as {unhandled?:unknown;message?:unknown};return payload.unhandled===true&&payload.message==="HTTPError";}catch{return false;}}

export default { async fetch(request:Request,env:unknown,ctx:unknown){ try{const api=await handleApi(request);if(api)return api;const handler=await getServerEntry();const response=await handler.fetch(request,env,ctx);return await normalizeCatastrophicSsrResponse(response);}catch(error){console.error(error);return new Response(renderErrorPage(),{status:500,headers:{"content-type":"text/html; charset=utf-8"}});} } };
