import crypto from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient, type Role, type StudentStatus } from "@prisma/client";
import { z } from "zod";

const scrypt = promisify(crypto.scrypt);
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const COOKIE = "sweetprompts_session";
const SESSION_MS = 8 * 60 * 60 * 1000;
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

export type SafeUser = { id: string; fullName: string; whatsapp: string; email: string | null; studentId: string | null; role: Role; status: StudentStatus };
export type AdminStudent = SafeUser & { createdAt: string; lastLoginAt: string | null };

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,19}$/),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  studentId: z.string().trim().min(1).max(80).optional().or(z.literal("")),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const loginSchema = z.object({ whatsapp: z.string().trim().min(8).max(24), password: z.string().min(1).max(128), remember: z.boolean().optional().default(false) });
export const adminLoginSchema = loginSchema;

function normalizeWhatsApp(value: string) { return value.trim().replace(/[\s()-]/g, ""); }
function hashToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, stored] = encoded.split(":");
  if (scheme !== "scrypt" || !salt || !stored) return false;
  try {
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(stored, "hex");
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  } catch { return false; }
}

function publicUser(user: { id: string; fullName: string; whatsappNumber: string; email: string | null; studentId: string | null; role: Role; status: StudentStatus }): SafeUser {
  return { id: user.id, fullName: user.fullName, whatsapp: user.whatsappNumber, email: user.email, studentId: user.studentId, role: user.role, status: user.status };
}

function cookie(token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(token)}; Max-Age=${Math.floor(maxAge / 1000)}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}
export function clearSessionCookie() { return cookie("", 0); }

export function getCookie(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map((v) => v.trim()).find((v) => v.startsWith(`${COOKIE}=`));
  return value ? decodeURIComponent(value.slice(COOKIE.length + 1)) : null;
}

function sameOrigin(request: Request) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) return;
  const expected = process.env.APP_ORIGIN?.trim();
  if (!expected) return;
  const origin = request.headers.get("origin");
  if (origin && origin !== expected) throw new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403, headers: { "Content-Type": "application/json" } });
  const referer = request.headers.get("referer");
  if (!origin && referer && new URL(referer).origin !== expected) throw new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403, headers: { "Content-Type": "application/json" } });
  if (!origin && !referer && request.headers.get("sec-fetch-site") === "cross-site") throw new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403, headers: { "Content-Type": "application/json" } });
}

const attempts = new Map<string, { count: number; resetAt: number }>();
export function enforceRateLimit(request: Request, key: string, max = 12) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("cf-connecting-ip") || "unknown";
  const bucketKey = `${key}:${ip}`; const now = Date.now(); const bucket = attempts.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) { attempts.set(bucketKey, { count: 1, resetAt: now + 900_000 }); return; }
  bucket.count += 1;
  if (bucket.count > max) throw new Response(JSON.stringify({ error: "Too many attempts. Please try again later." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) } });
}

export async function createSession(userId: string, remember = false) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_MS : SESSION_MS));
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt, rememberDevice: remember } });
  return { token, expiresAt };
}

export async function getSessionUser(request: Request): Promise<SafeUser | null> {
  const token = getCookie(request); if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) { await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined); return null; }
  if (session.user.status !== "APPROVED") { await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined); return null; }
  return publicUser(session.user);
}

export async function requireAuth(request: Request) {
  sameOrigin(request); const user = await getSessionUser(request);
  if (!user) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() } });
  return user;
}
export async function requireAdmin(request: Request) {
  const user = await requireAuth(request);
  if (user.role !== "SUPER_ADMIN") throw new Response(JSON.stringify({ error: "Super Admin access is required." }), { status: 403, headers: { "Content-Type": "application/json" } });
  return user;
}
export async function destroySession(request: Request) { const token = getCookie(request); if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }); }
export async function invalidateUserSessions(userId: string) { await prisma.session.deleteMany({ where: { userId } }); }

export async function registerStudent(input: unknown) {
  const parsed = registerSchema.parse(input); const whatsapp = normalizeWhatsApp(parsed.whatsapp); const studentId = parsed.studentId || null;
  const duplicate = await prisma.user.findFirst({ where: { OR: [{ whatsappNumber: whatsapp }, ...(studentId ? [{ studentId }] : [])] }, select: { id: true } });
  if (duplicate) throw new Error("A student with this WhatsApp number or student ID already exists.");
  try { await prisma.user.create({ data: { fullName: parsed.fullName, whatsappNumber: whatsapp, email: parsed.email || null, studentId, passwordHash: await hashPassword(parsed.password), role: "STUDENT", status: "PENDING" } }); }
  catch (error) { if ((error as { code?: string }).code === "P2002") throw new Error("A student with this WhatsApp number or student ID already exists."); throw new Error("Unable to create the account right now."); }
}

export async function loginStudent(whatsappInput: string, password: string, remember = false) {
  const user = await prisma.user.findUnique({ where: { whatsappNumber: normalizeWhatsApp(whatsappInput) } });
  if (!user || user.role !== "STUDENT" || !(await verifyPassword(password, user.passwordHash))) throw new Error("Invalid WhatsApp number or password.");
  if (user.status === "PENDING") throw new Error("Your account is pending approval by the Super Admin.");
  if (user.status === "REJECTED") throw new Error("Your registration has been rejected by the Super Admin.");
  if (user.status === "SUSPENDED") throw new Error("Your account is suspended. Please contact the Super Admin.");
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return createSession(user.id, remember);
}

export async function loginAdmin(whatsappInput: string, password: string, remember = true) {
  const whatsapp = normalizeWhatsApp(whatsappInput); const configured = normalizeWhatsApp(process.env.ADMIN_WHATSAPP || ""); const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
  if (!configured || !configuredHash) throw new Error("Super Admin is not configured yet.");
  if (whatsapp !== configured || !(await verifyPassword(password, configuredHash))) throw new Error("Invalid Super Admin credentials.");
  let admin = await prisma.user.findUnique({ where: { whatsappNumber: whatsapp } });
  if (admin && admin.role !== "SUPER_ADMIN") throw new Error("The configured admin WhatsApp is already registered as a student.");
  if (!admin) admin = await prisma.user.create({ data: { fullName: "Super Admin", whatsappNumber: whatsapp, passwordHash: configuredHash, role: "SUPER_ADMIN", status: "APPROVED" } });
  else admin = await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: configuredHash, status: "APPROVED", lastLoginAt: new Date() } });
  return createSession(admin.id, remember);
}

export function sessionResponse(body: unknown, token: string, expiresAt: Date, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Set-Cookie": cookie(token, expiresAt.getTime() - Date.now()) } }); }
export function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }

export async function adminStudents(): Promise<AdminStudent[]> {
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { createdAt: "desc" }, select: { id: true, fullName: true, whatsappNumber: true, email: true, studentId: true, role: true, status: true, createdAt: true, lastLoginAt: true } });
  return students.map((student) => ({ ...publicUser(student), createdAt: student.createdAt.toISOString(), lastLoginAt: student.lastLoginAt?.toISOString() || null }));
}

export async function updateStudentStatus(id: string, status: StudentStatus) {
  if (!["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(status)) throw new Error("Invalid student status.");
  const student = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!student || student.role !== "STUDENT") throw new Error("Student not found.");
  const updated = await prisma.user.update({ where: { id }, data: { status }, select: { id: true, status: true } });
  if (status !== "APPROVED") await invalidateUserSessions(id);
  return updated;
}
