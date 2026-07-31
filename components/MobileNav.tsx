"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, HandCoins, PackageSearch, Users, CalendarClock } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/donations", label: "Gifts", icon: HandCoins },
  { href: "/inventory", label: "Stock", icon: PackageSearch },
  { href: "/volunteers", label: "People", icon: Users },
  { href: "/shifts", label: "Shifts", icon: CalendarClock },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-ink-900/95 backdrop-blur border-t border-paper/10 flex justify-around py-2">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] focus-ring rounded-lg ${
              active ? "text-gold" : "text-paper/50"
            }`}
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
