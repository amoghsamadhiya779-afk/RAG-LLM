import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site/header";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Role } from "@/types";

type SearchParams = { redirect?: string; mode?: "in" | "up" };

export const Route = createFileRoute("/auth")({
 validateSearch: (s: Record<string, unknown>): SearchParams => ({
  redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  mode: s.mode === "up" ? "up" : "in",
 }),
 head: () => ({ meta: [{ title: "Sign in — jOBiON" }] }),
 component: AuthPage,
});

const signInSchema = z.object({ email: z.string().trim().email(), password: z.string().min(6) });
const signUpSchema = signInSchema.extend({ fullName: z.string().trim().min(2).max(80), role: z.enum(["seeker", "employer"]) });

function AuthPage() {
 const { mode: initialMode, redirect } = Route.useSearch();
 const [mode, setMode] = useState<"in" | "up">(initialMode ?? "in");
 const [role, setRole] = useState<Role>("seeker");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [fullName, setFullName] = useState("");
 const [busy, setBusy] = useState(false);
 const { signIn, signUp } = useAuth();
 const navigate = useNavigate();

 const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setBusy(true);
  try {
   if (mode === "in") {
    signInSchema.parse({ email, password });
    await signIn({ email, password });
   } else {
    signUpSchema.parse({ email, password, fullName, role });
    await signUp({ email, password, fullName, role });
   }
   toast.success(mode === "in" ? "Welcome back" : "Account created");
   navigate({ to: redirect ?? "/", replace: true });
  } catch (err) {
   const msg = err instanceof z.ZodError ? err.issues[0].message : err instanceof Error ? err.message : "Failed";
   toast.error(msg);
  } finally {
   setBusy(false);
  }
 };

 const demoSignIn = async (email: string) => {
  setBusy(true);
  try {
   await signIn({ email, password: "demo1234" });
   toast.success("Signed in");
   navigate({ to: redirect ?? "/" });
  } catch (e) {
   toast.error(e instanceof Error ? e.message : "Failed");
  } finally {
   setBusy(false);
  }
 };

 return (
  <div className="min-h-dvh flex flex-col">
   <SiteHeader />
   <main className="flex-1 grid place-items-center px-4 py-12">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
     <div className="glass-card p-8">
      <div className="mb-6 flex rounded-md bg-secondary p-1 text-small">
       <button onClick={() => setMode("in")} className={`flex-1 rounded px-3 py-1.5 ${mode === "in" ? "bg-background " : "text-secondary"}`}>Sign in</button>
       <button onClick={() => setMode("up")} className={`flex-1 rounded px-3 py-1.5 ${mode === "up" ? "bg-background " : "text-secondary"}`}>Create account</button>
      </div>

      <h1 className="font-display text-h3 font-heading">{mode === "in" ? "Welcome back" : "Join jOBiON"}</h1>
      <p className="mt-1 text-small text-secondary">{mode === "in" ? "Sign in to apply and track replies." : "Free for candidates. Always."}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
       {mode === "up" && (
        <>
         <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
         </div>
         <div>
          <Label>I'm a…</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
           <button type="button" onClick={() => setRole("seeker")} className={`rounded-md border px-3 py-2 text-small ${role === "seeker" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Job seeker</button>
           <button type="button" onClick={() => setRole("employer")} className={`rounded-md border px-3 py-2 text-small ${role === "employer" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Employer</button>
          </div>
         </div>
        </>
       )}
       <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
       </div>
       <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
       </div>
       <Button type="submit" className="w-full" disabled={busy}>{busy ? "…" : mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-micro text-secondary">
       <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-2">
       <Button type="button" variant="outline" disabled aria-label="Continue with GitHub"><Github className="h-4 w-4" />GitHub</Button>
       <Button type="button" variant="outline" disabled aria-label="Continue with Google"><Mail className="h-4 w-4" />Google</Button>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border p-3 text-micro text-secondary">
       <div className="mb-2 font-ui text-foreground">Demo accounts</div>
       <div className="flex flex-wrap gap-2">
        <button onClick={() => demoSignIn("alex@example.com")} className="rounded-md bg-secondary px-2 py-1 hover:bg-secondary/80">Seeker</button>
        <button onClick={() => demoSignIn("hire@stellar.dev")} className="rounded-md bg-secondary px-2 py-1 hover:bg-secondary/80">Employer</button>
        <button onClick={() => demoSignIn("admin@jOBiON.io")} className="rounded-md bg-secondary px-2 py-1 hover:bg-secondary/80">Admin</button>
       </div>
      </div>
     </div>
     <p className="mt-4 text-center text-micro text-secondary">
      By continuing you agree to our <Link to="/" className="underline">Terms</Link>.
     </p>
    </motion.div>
   </main>
  </div>
 );
}
