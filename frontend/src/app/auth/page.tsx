"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Role } from "@/types";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("job_seeker");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn({ email, password });
        toast.success("Welcome back to Dimension.");
      } else {
        await signUp({ email, password, role, fullName });
        toast.success("Account created successfully.");
      }
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4 pt-16">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0 bg-dawn-wash opacity-20 mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-radial-indigo opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card relative z-10 w-full max-w-[420px]"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-pill bg-bone text-void font-bold text-lg">D</div>
          <h1 className="font-geist text-2xl font-medium text-bone">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-mist">
            {isLogin
              ? "Enter your credentials to access your workspace."
              : "Join Dimension to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-mist">Full Name</label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="h-11 rounded-inputs border-bone/10 bg-void/50 px-4 text-bone placeholder:text-smoke focus-visible:ring-bone/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-mist">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("job_seeker")}
                      className={`h-10 rounded-pill text-[14px] font-medium transition-colors ${role === "job_seeker" ? "bg-bone text-void" : "bg-iron text-mist hover:text-bone"}`}
                    >
                      Job Seeker
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("employer")}
                      className={`h-10 rounded-pill text-[14px] font-medium transition-colors ${role === "employer" ? "bg-bone text-void" : "bg-iron text-mist hover:text-bone"}`}
                    >
                      Employer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-mist">Email</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="h-11 rounded-inputs border-bone/10 bg-void/50 px-4 text-bone placeholder:text-smoke focus-visible:ring-bone/20"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-mist">Password</label>
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-inputs border-bone/10 bg-void/50 px-4 text-bone placeholder:text-smoke focus-visible:ring-bone/20"
            />
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? "Authenticating..." : isLogin ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-[13px] text-fog">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-bone transition-colors hover:text-paper"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
