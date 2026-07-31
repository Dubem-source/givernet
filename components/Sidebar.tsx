"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutGrid,
  HandCoins,
  PackageSearch,
  Users,
  CalendarClock,
  HeartHandshake,
  LogOut,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/donations", label: "Donations", icon: HandCoins },
  { href: "/inventory", label: "Inventory", icon: PackageSearch },
  { href: "/volunteers", label: "Volunteers", icon: Users },
  { href: "/shifts", label: "Shifts", icon: CalendarClock },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-paper/10 bg-ink-900/60 min-h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <HeartHandshake className="text-gold" size={24} strokeWidth={1.75} />
        <span className="font-display text-lg tracking-tight">GiverNet</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring ${
                active
                  ? "bg-gold/15 text-gold border border-gold/20"
                  : "text-paper/65 hover:text-paper hover:bg-paper/5 border border-transparent"
              }`}
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-paper/50 hover:text-coral hover:bg-coral/10 transition-colors focus-ring"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
