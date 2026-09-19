import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/lib/auth";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", username: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (form.password.length < 6) return setError("Password iwe na angalau herufi/namba 6.");
    if (form.password !== form.confirmPassword) return setError("Password hazifanani.");
    setLoading(true);
    try { await registerUser({ fullName: form.fullName, username: form.username, phone: form.phone, password: form.password }); await navigate({ to: "/payment" }); }
    catch (e) { setError(e instanceof Error ? e.message : "Usajili umeshindikana."); }
    finally { setLoading(false); }
  };
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground"><div className="mx-auto max-w-md">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-page-muted"><ArrowLeft className="size-4" /> Rudi</Link>
    <div className="mt-5 rounded-xl bg-card p-6 text-card-foreground shadow-xl"><div className="text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-accent"><UserPlus /></div><h1 className="mt-4 font-display text-3xl font-extrabold">Jisajili Tvideo</h1><p className="mt-2 text-sm font-semibold text-card-muted">Jaza taarifa zako. Taarifa zitasajiliwa kwenye database.</p></div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {[["fullName","Jina kamili","text"],["username","Username","text"],["phone","Namba ya simu","tel"]].map(([name,label,type]) => <label key={name} className="block text-sm font-bold">{label}<input required type={type} value={form[name as keyof typeof form]} onChange={e => setForm({...form,[name]:e.target.value})} className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>)}
        <label className="block text-sm font-bold">Password<input required minLength={6} type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
        <label className="block text-sm font-bold">Thibitisha Password<input required type="password" value={form.confirmPassword} onChange={e => setForm({...form,confirmPassword:e.target.value})} className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p>}
        <Button type="submit" variant="accent" size="lg" className="w-full font-display font-extrabold" disabled={loading}><LockKeyhole className="size-4" />{loading ? "Inasajili..." : "JISAJILI"}</Button>
      </form>
      <p className="mt-5 text-center text-sm font-semibold text-card-muted">Una account? <Link to="/login" className="font-extrabold text-primary">Log in</Link></p>
    </div>
  </div></main>;
}
