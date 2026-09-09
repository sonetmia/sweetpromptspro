import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import SweetPrompts from "@/components/SweetPrompts";

type User = { id: string; fullName: string; whatsapp: string; email: string | null; studentId: string | null; role: "STUDENT" | "SUPER_ADMIN"; status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" };

type Mode = "login" | "register" | "admin";

const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary";

function AuthForm({ mode, onLoggedIn }: { mode: Mode; onLoggedIn: (user: User) => void }) {
  const [login, setLogin] = useState({ whatsapp: "", password: "", remember: false });
  const [register, setRegister] = useState({ fullName: "", whatsapp: "", email: "", studentId: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : mode === "admin" ? "/api/admin/login" : "/api/auth/login";
      const body = mode === "register" ? register : login;
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (mode === "register") { setMessage(data.message); setRegister({ fullName: "", whatsapp: "", email: "", studentId: "", password: "", confirmPassword: "" }); }
      else { const me = await fetch("/api/auth/me", { credentials: "include" }); const current = await me.json(); onLoggedIn(current.user); }
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl">
      <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sweet Prompts</p><h1 className="mt-2 text-2xl font-bold">{mode === "admin" ? "Super Admin Login" : mode === "register" ? "Create Student Account" : "Student Login"}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === "admin" ? "Restricted administrator access." : mode === "register" ? "Submit your registration for approval." : "Sign in to continue to your prompt studio."}</p></div>
      {mode === "register" ? <>
        <div className="space-y-3"><input className={inputClass} placeholder="Full Name" value={register.fullName} onChange={e=>setRegister({...register,fullName:e.target.value})} required /><input className={inputClass} placeholder="WhatsApp Number" value={register.whatsapp} onChange={e=>setRegister({...register,whatsapp:e.target.value})} required /><input className={inputClass} type="email" placeholder="Email (optional)" value={register.email} onChange={e=>setRegister({...register,email:e.target.value})} /><input className={inputClass} placeholder="Student / Registration ID (optional)" value={register.studentId} onChange={e=>setRegister({...register,studentId:e.target.value})} /><input className={inputClass} type="password" placeholder="Password (8+ characters)" value={register.password} onChange={e=>setRegister({...register,password:e.target.value})} required minLength={8} /><input className={inputClass} type="password" placeholder="Confirm Password" value={register.confirmPassword} onChange={e=>setRegister({...register,confirmPassword:e.target.value})} required minLength={8} /></div>
      </> : <div className="space-y-3"><input className={inputClass} placeholder="WhatsApp Number" value={login.whatsapp} onChange={e=>setLogin({...login,whatsapp:e.target.value})} required /><input className={inputClass} type="password" placeholder="Password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} required /><label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={login.remember} onChange={e=>setLogin({...login,remember:e.target.checked})} /> Remember me</label></div>}
      {error && <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">{message}</p>}
      <button disabled={busy} className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Please wait..." : mode === "register" ? "Submit Registration" : "Sign In"}</button>
      {mode === "login" && <div className="mt-5 flex justify-between text-sm"><button type="button" className="text-primary hover:underline" onClick={()=>{ window.location.href="/register"; }}>Create account</button><button type="button" className="text-muted-foreground hover:underline" onClick={()=>{ window.location.href="/admin/login"; }}>Super Admin</button></div>}
      {mode === "register" && <button type="button" className="mt-4 w-full text-sm text-primary hover:underline" onClick={()=>{ window.location.href="/login"; }}>Back to login</button>}
      {mode === "admin" && <button type="button" className="mt-4 w-full text-sm text-primary hover:underline" onClick={()=>{ window.location.href="/login"; }}>Student login</button>}
    </form>
  </div>;
}

function AdminDashboard({ user }: { user: User }) {
  const [students, setStudents] = useState<any[]>([]); const [filter, setFilter] = useState("ALL"); const [busy, setBusy] = useState(false);
  async function load() { const r = await fetch("/api/admin/students", { credentials: "include" }); if (r.ok) setStudents((await r.json()).students); }
  useEffect(()=>{ void load(); },[]);
  async function status(id: string, next: User["status"]) { setBusy(true); try { await fetch(`/api/admin/students/${id}/status`, { method:"PATCH", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify({status:next}) }); await load(); } finally { setBusy(false); } }
  async function logout() { await fetch("/api/auth/logout", {method:"POST",credentials:"include"}); window.location.href="/login"; }
  const visible = filter === "ALL" ? students : students.filter(s=>s.status===filter);
  const counts = students.reduce((a,s)=>(a[s.status]=(a[s.status]||0)+1,a),{} as Record<string,number>);
  return <div className="min-h-screen bg-background p-4 md:p-8"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sweet Prompts</p><h1 className="text-3xl font-bold">Super Admin Dashboard</h1><p className="text-sm text-muted-foreground">Signed in as {user.whatsapp}</p></div><button onClick={logout} className="rounded-xl border border-border px-4 py-2 text-sm">Logout</button></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{["PENDING","APPROVED","REJECTED","SUSPENDED"].map(s=><div key={s} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{s}</p><p className="mt-1 text-2xl font-bold">{counts[s]||0}</p></div>)}</div><div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card"><div className="flex flex-wrap gap-2 border-b border-border p-4">{["ALL","PENDING","APPROVED","REJECTED","SUSPENDED"].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-lg px-3 py-2 text-sm ${filter===s?"bg-primary text-primary-foreground":"border border-border"}`}>{s}</button>)}</div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-4">Student</th><th className="p-4">WhatsApp</th><th className="p-4">Student ID</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{visible.map(s=><tr key={s.id} className="border-b border-border last:border-0"><td className="p-4"><div className="font-medium">{s.fullName}</div><div className="text-xs text-muted-foreground">{s.email||"No email"}</div></td><td className="p-4">{s.whatsapp}</td><td className="p-4">{s.studentId||"—"}</td><td className="p-4">{s.status}</td><td className="p-4"><select disabled={busy} value={s.status} onChange={e=>void status(s.id,e.target.value as User["status"])} className="rounded-lg border border-border bg-background px-2 py-2"><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>SUSPENDED</option></select></td></tr>)}</tbody></table>{visible.length===0&&<p className="p-8 text-center text-sm text-muted-foreground">No students found.</p>}</div></div></div></div>;
}

export default function AuthGate({ mode }: { mode?: Mode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true); const navigate = useNavigate();
  useEffect(()=>{ fetch("/api/auth/me", {credentials:"include"}).then(async r=>r.ok?(await r.json()).user:null).then((u)=>{ setUser(u); setLoading(false); }).catch(()=>setLoading(false)); },[]);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Checking session...</div>;
  if (mode) { if (user) { if (user.role === "SUPER_ADMIN") { if (mode === "admin") return <AdminDashboard user={user}/>; navigate({to:"/"}); } if (user.status === "APPROVED" && mode !== "register") navigate({to:"/"}); } return <AuthForm mode={mode} onLoggedIn={setUser}/>; }
  if (!user) return <AuthForm mode="login" onLoggedIn={setUser}/>;
  if (user.role === "SUPER_ADMIN") return <AdminDashboard user={user}/>;
  if (user.status !== "APPROVED") return <div className="min-h-screen flex items-center justify-center p-4"><div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center"><h1 className="text-2xl font-bold">Account {user.status}</h1><p className="mt-3 text-sm text-muted-foreground">{user.status === "PENDING" ? "Your registration is waiting for Super Admin approval." : user.status === "REJECTED" ? "Your registration was rejected by the Super Admin." : "Your account is currently suspended."}</p><button className="mt-6 rounded-xl bg-primary px-5 py-3 text-primary-foreground" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});window.location.href="/login";}}>Logout</button></div></div>;
  return <SweetPrompts/>;
}
