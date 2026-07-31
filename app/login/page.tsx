"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HeartHandshake } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    // 1. Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // 2. If sign in fails, attempt to auto-signup (in case it's a new tester/lecturer account)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      // If the user already exists, it means they entered the wrong password
      if (
        signUpError.message.toLowerCase().includes("already") || 
        signUpError.message.toLowerCase().includes("taken") ||
        signUpError.message.toLowerCase().includes("registered")
      ) {
        setError(signInError.message);
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (signUpData?.session) {
      // If email confirmation is disabled, signup automatically logs them in
      router.push("/dashboard");
      router.refresh();
    } else {
      // If email confirmation is enabled, they need to verify
      setMessage("Account registered! Please check your email to verify your account, then sign in.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-grain">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <HeartHandshake className="text-gold" size={28} strokeWidth={1.75} />
          <span className="font-display text-2xl tracking-tight">GiverNet</span>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          <div>
            <h1 className="font-display text-xl mb-1">Staff sign in</h1>
            <p className="text-sm text-paper/60">
              Enter your email and password to log in. New users will be automatically registered.
            </p>
          </div>

          {error && (
            <div className="text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {message && (
            <div className="text-sm text-sage bg-sage/10 border border-sage/30 rounded-lg px-3 py-2">
              {message}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs uppercase tracking-wide text-paper/50">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-700 border border-paper/10 rounded-lg px-3 py-2.5 text-sm focus-ring outline-none placeholder:text-paper/30"
              placeholder="you@organization.org"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs uppercase tracking-wide text-paper/50">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-700 border border-paper/10 rounded-lg px-3 py-2.5 text-sm focus-ring outline-none placeholder:text-paper/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-ink-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-light transition-colors disabled:opacity-60 focus-ring"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
