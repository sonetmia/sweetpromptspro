import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const env = (name: string) => {
  const value = typeof process !== "undefined" ? process.env[name] : undefined;
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
};

const db = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const COOKIE = "sp_session";
const SESSION_HOURS = 8;
const REMEMBER_DAYS = 30;
const PASSWORD_ITERATIONS = 310_000;

type Role = "STUDENT" | "SUPER_ADMIN";
type Status = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    whatsapp: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,19}$/),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    studentId: z.string().trim().min(1).max(80).optional().or(z.literal("")),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  whatsapp: z.string().trim().min(8).max(24),
  password: z.string().min(1).max(128),
  remember: z.boolean().optional().default(false),
});
export const adminLoginSchema = loginSchema;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sessionHash(token: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function derivePassword(password: string, salt: Uint8Array, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(await derivePassword(password, salt))}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [scheme, iterationsText, saltText, digestText] = encoded.split("$");
  const iterations = Number(iterationsText);
  if (scheme !== "pbkdf2_sha256" || !Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 1_000_000 || !saltText || !digestText) return false;
  try {
    const actual = await derivePassword(password, base64ToBytes(saltText), iterations);
    const expected = base64ToBytes(digestText);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

export type SafeUser = {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string | null;
  studentId: string | null;
  role: Role;
  status: Status;
};

type DbUser = {
  id: string;
  full_name: string;
  whatsapp_number: string;
  email: string | null;
  student_id: string | null;
  password_hash: string;
  role: Role;
  status: Status;
  last_login_at: string | null;
};

function safeUser(user: DbUser): SafeUser {
  return { id: user.id, fullName: user.full_name, whatsapp: user.whatsapp_number, email: user.email, studentId: user.student_id, role: user.role, status: user.status };
}

function normalizeWhatsApp(value: string) {
  return value.replace(/[\s()-]/g, "");
}

function cookieHeader(token: string, expiresAt: Date) {
  const secure = typeof process !== "undefined" && process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Expires=${expiresAt.toUTCString()}`;
}

export function clearSessionCookie() {
  const secure = typeof process !== "undefined" && process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}

export function getCookie(request: Request) {
  const raw = request.headers.get("cookie") || "";
  const match = raw.split(";").map((v) => v.trim()).find((v) => v.startsWith(`${COOKIE}=`));
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : null;
}

function enforceSameOrigin(request: Request) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) return;
  const expected = typeof process !== "undefined" ? process.env.APP_ORIGIN : undefined;
  if (!expected) throw new Response(JSON.stringify({ error: "Server origin is not configured." }), { status: 500, headers: { "Content-Type": "application/json" } });
  const origin = request.headers.get("origin");
  if (origin) {
    if (origin !== expected) throw new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403, headers: { "Content-Type": "application/json" } });
    return;
  }
  const referer = request.headers.get("referer");
  if (referer && new URL(referer).origin !== expected) throw new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403, headers: { "Content-Type": "application/json" } });
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403, headers: { "Content-Type": "application/json" } });
}

const attempts = new Map<string, { count: number; resetAt: number }>();
export function enforceRateLimit(request: Request, keySuffix: string, max = 12, windowMs = 15 * 60_000) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("cf-connecting-ip") || "unknown";
  const key = `${keySuffix}:${ip}`;
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) throw new Response(JSON.stringify({ error: "Too many attempts. Please try again later." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } });
}

export async function createSession(userId: string, remember = false) {
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_DAYS * 86400_000 : SESSION_HOURS * 3600_000));
  const { error } = await db().from("auth_sessions").insert({ user_id: userId, token_hash: await sessionHash(token), expires_at: expiresAt.toISOString(), remember_device: remember });
  if (error) throw new Error(error.message);
  return { token, expiresAt };
}

export async function getSessionUser(request: Request): Promise<SafeUser | null> {
  const token = getCookie(request);
  if (!token) return null;
  const { data, error } = await db().from("auth_sessions").select("user_id, expires_at, auth_users(*)").eq("token_hash", await sessionHash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !data || !data.auth_users) return null;
  const user = data.auth_users as unknown as DbUser;
  if (user.status === "REJECTED" || user.status === "SUSPENDED") {
    await invalidateUserSessions(user.id);
    return null;
  }
  return safeUser(user);
}

export async function requireAuth(request: Request) {
  enforceSameOrigin(request);
  const user = await getSessionUser(request);
  if (!user) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() } });
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireAuth(request);
  if (user.role !== "SUPER_ADMIN" || user.status !== "APPROVED") throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  return user;
}

export async function destroySession(request: Request) {
  const token = getCookie(request);
  if (token) await db().from("auth_sessions").delete().eq("token_hash", await sessionHash(token));
}

export async function invalidateUserSessions(userId: string) {
  await db().from("auth_sessions").delete().eq("user_id", userId);
}

export async function registerStudent(input: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.parse(input);
  const whatsapp = normalizeWhatsApp(parsed.whatsapp);
  const studentId = parsed.studentId || null;
  const email = parsed.email || null;
  const client = db();
  const duplicate = await client.from("auth_users").select("id").or(`whatsapp_number.eq.${whatsapp}${studentId ? `,student_id.eq.${studentId}` : ""}`).limit(1);
  if (duplicate.error) throw new Error("Unable to validate registration right now.");
  if (duplicate.data?.length) throw new Error("A student with this WhatsApp number or student ID already exists.");
  const { error } = await client.from("auth_users").insert({ full_name: parsed.fullName, whatsapp_number: whatsapp, email, student_id: studentId, password_hash: await hashPassword(parsed.password), role: "STUDENT", status: "PENDING" });
  if (error?.code === "23505") throw new Error("A student with this WhatsApp number or student ID already exists.");
  if (error) throw new Error("Unable to create the account right now.");
}

export async function loginStudent(whatsappInput: string, password: string, remember: boolean) {
  const whatsapp = normalizeWhatsApp(whatsappInput);
  const { data, error } = await db().from("auth_users").select("*").eq("whatsapp_number", whatsapp).eq("role", "STUDENT").maybeSingle();
  if (error) throw new Error("Unable to complete login right now.");
  if (!data || !(await verifyPassword(password, data.password_hash))) throw new Error("Invalid WhatsApp number or password.");
  if (data.status === "PENDING") throw new Error("Your account is pending approval by the Super Admin.");
  if (data.status === "REJECTED") throw new Error("Your registration has been rejected by the Super Admin.");
  if (data.status === "SUSPENDED") throw new Error("Your account is suspended. Please contact the Super Admin.");
  await db().from("auth_users").update({ last_login_at: new Date().toISOString() }).eq("id", data.id);
  return createSession(data.id, remember);
}

export async function loginAdmin(whatsappInput: string, password: string, remember: boolean) {
  const whatsapp = normalizeWhatsApp(whatsappInput);
  const configured = env("ADMIN_WHATSAPP");
  if (whatsapp !== normalizeWhatsApp(configured) || !(await verifyPassword(password, env("ADMIN_PASSWORD_HASH")))) throw new Error("Invalid administrator credentials.");
  const client = db();
  const existing = await client.from("auth_users").select("id").eq("whatsapp_number", whatsapp).eq("role", "SUPER_ADMIN").maybeSingle();
  if (existing.error) throw new Error("Unable to complete administrator login right now.");
  let userId = existing.data?.id as string | undefined;
  if (!userId) {
    const { data, error } = await client.from("auth_users").insert({ full_name: "Super Admin", whatsapp_number: whatsapp, password_hash: env("ADMIN_PASSWORD_HASH"), role: "SUPER_ADMIN", status: "APPROVED" }).select("id").single();
    if (error) throw new Error("Unable to initialize administrator access.");
    userId = data.id;
  }
  await client.from("auth_users").update({ status: "APPROVED", password_hash: env("ADMIN_PASSWORD_HASH"), last_login_at: new Date().toISOString() }).eq("id", userId);
  return createSession(userId, remember);
}

export function sessionResponse(body: unknown, token: string, expiresAt: Date, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Set-Cookie": cookieHeader(token, expiresAt) } });
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export type AdminStudent = {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string | null;
  studentId: string | null;
  status: Status;
  createdAt: string;
  lastLoginAt: string | null;
};

export async function adminStudents(): Promise<AdminStudent[]> {
  const { data, error } = await db().from("auth_users").select("id,full_name,whatsapp_number,email,student_id,role,status,created_at,last_login_at").eq("role", "STUDENT").order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load students right now.");
  return (data || []).map((u) => ({ id: u.id, fullName: u.full_name, whatsapp: u.whatsapp_number, email: u.email, studentId: u.student_id, status: u.status, createdAt: u.created_at, lastLoginAt: u.last_login_at }));
}

export async function updateStudentStatus(id: string, status: Status) {
  const { data, error } = await db().from("auth_users").update({ status }).eq("id", id).eq("role", "STUDENT").select("id,status").maybeSingle();
  if (error || !data) throw new Error("Student not found.");
  if (status !== "APPROVED") await invalidateUserSessions(id);
  return data;
}
