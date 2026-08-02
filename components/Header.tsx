"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
    getUser();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-end gap-3 py-3 mb-6 border-b border-paper/10">
      {email && (
        <div className="flex items-center gap-1.5 text-[11px] text-paper/50 bg-paper/5 px-2.5 py-1.2 rounded-full border border-paper/10">
          <User size={11} className="text-gold" />
          <span>{email}</span>
        </div>
      )}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-[11px] text-paper/60 hover:text-coral bg-paper/5 hover:bg-coral/10 border border-paper/10 hover:border-coral/20 rounded-md px-2.5 py-1.5 transition-all focus-ring"
      >
        <LogOut size={11} strokeWidth={2} />
        <span>Sign out</span>
      </button>
    </header>
  );
}
