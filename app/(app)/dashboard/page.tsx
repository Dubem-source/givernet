"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatCard from "@/components/StatCard";
import { HandCoins, PackageSearch, Users, CalendarClock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Donation, InventoryItem, Shift } from "@/lib/types";

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [monthTotal, setMonthTotal] = useState(0);
  const [itemGiftCount, setItemGiftCount] = useState(0);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [openShiftCount, setOpenShiftCount] = useState(0);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);

  useEffect(() => {
    async function load() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [donationsRes, inventoryRes, volunteersRes, shiftsRes] = await Promise.all([
        supabase.from("donations").select("*").order("received_at", { ascending: false }).limit(6),
        supabase.from("inventory_items").select("*"),
        supabase.from("volunteers").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("shifts").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
      ]);

      const donations = donationsRes.data ?? [];
      setRecentDonations(donations);

      const { data: monthDonations } = await supabase
        .from("donations")
        .select("amount, type")
        .gte("received_at", startOfMonth.toISOString());
      const total = (monthDonations ?? [])
        .filter((d) => d.type === "monetary")
        .reduce((sum, d) => sum + (d.amount ?? 0), 0);
      setMonthTotal(total);
      setItemGiftCount((monthDonations ?? []).filter((d) => d.type === "item").length);

      const inventory = inventoryRes.data ?? [];
      setLowStock(inventory.filter((i: InventoryItem) => i.quantity <= i.low_stock_threshold));

      setVolunteerCount(volunteersRes.count ?? 0);

      const shifts = shiftsRes.data ?? [];
      setUpcomingShifts(shifts);
      setOpenShiftCount(shifts.filter((s: Shift) => s.status === "open").length);

      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-wide text-gold mb-1.5">Overview</p>
        <h1 className="font-display text-3xl">Good to see you.</h1>
        <p className="text-paper/55 text-sm mt-1.5">Here&apos;s what&apos;s moving across GiverNet this month.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Raised this month"
          value={loading ? "—" : `₦${monthTotal.toLocaleString()}`}
          sub={`${itemGiftCount} item gifts logged`}
          icon={HandCoins}
          accent="gold"
        />
        <StatCard
          label="Low stock items"
          value={loading ? "—" : String(lowStock.length)}
          sub="Below threshold"
          icon={PackageSearch}
          accent={lowStock.length > 0 ? "coral" : "sage"}
        />
        <StatCard
          label="Active volunteers"
          value={loading ? "—" : String(volunteerCount)}
          sub="On the roster"
          icon={Users}
          accent="sage"
        />
        <StatCard
          label="Open shifts"
          value={loading ? "—" : String(openShiftCount)}
          sub="Need coverage"
          icon={CalendarClock}
          accent="gold"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass rounded-2xl p-6">
          <h2 className="font-display text-lg mb-4">Recent donations</h2>
          {recentDonations.length === 0 ? (
            <p className="text-sm text-paper/45">No donations logged yet. Once gifts come in, they&apos;ll appear here.</p>
          ) : (
            <div>
              {recentDonations.map((d) => (
                <div key={d.id} className="ledger-row flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{d.donor_name}</p>
                    <p className="text-xs text-paper/45">
                      {d.type === "monetary" ? "Monetary gift" : `${d.quantity ?? ""} × ${d.item_name}`} · {format(new Date(d.received_at), "MMM d")}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-gold">
                    {d.type === "monetary" ? `₦${(d.amount ?? 0).toLocaleString()}` : "in-kind"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg mb-4">Upcoming shifts</h2>
            {upcomingShifts.length === 0 ? (
              <p className="text-sm text-paper/45">No shifts scheduled. Create one from the Shifts page.</p>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map((s) => (
                  <div key={s.id} className="ledger-row pb-3">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-paper/45">{format(new Date(s.starts_at), "EEE MMM d, h:mm a")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lowStock.length > 0 && (
            <div className="glass rounded-2xl p-6 border-coral/20">
              <h2 className="font-display text-lg mb-4 flex items-center gap-2 text-coral">
                <AlertTriangle size={17} /> Restock needed
              </h2>
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((i) => (
                  <div key={i.id} className="ledger-row pb-3 flex justify-between text-sm">
                    <span>{i.name}</span>
                    <span className="font-mono text-coral">{i.quantity} {i.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
