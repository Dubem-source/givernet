"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import { Plus, HandCoins } from "lucide-react";
import { format } from "date-fns";
import type { Donation, DonationType } from "@/lib/types";

const emptyForm = {
  donor_name: "",
  type: "monetary" as DonationType,
  amount: "",
  item_name: "",
  quantity: "",
  category: "",
  notes: "",
};

export default function DonationsPage() {
  const supabase = createClient();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<"all" | DonationType>("all");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("donations").select("*").order("received_at", { ascending: false });
    setDonations(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("donations").insert({
      donor_name: form.donor_name || "Anonymous",
      type: form.type,
      amount: form.type === "monetary" ? Number(form.amount) : null,
      item_name: form.type === "item" ? form.item_name : null,
      quantity: form.type === "item" ? Number(form.quantity) : null,
      category: form.category || null,
      notes: form.notes || null,
    });
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    load();
  }

  const filtered = filter === "all" ? donations : donations.filter((d) => d.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold mb-1.5">Ledger</p>
          <h1 className="font-display text-3xl">Donations</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gold text-ink-900 font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-gold-light transition-colors focus-ring"
        >
          <Plus size={16} /> Log donation
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "monetary", "item"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors focus-ring ${
              filter === f
                ? "border-gold text-gold bg-gold/10"
                : "border-paper/15 text-paper/55 hover:text-paper"
            }`}
          >
            {f === "all" ? "All" : f === "monetary" ? "Monetary" : "In-kind"}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        {loading ? (
          <p className="text-sm text-paper/45">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <HandCoins className="mx-auto text-paper/20 mb-3" size={32} />
            <p className="text-sm text-paper/45">No donations logged yet. Add the first one to start the ledger.</p>
          </div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="ledger-row flex items-center justify-between py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{d.donor_name}</p>
                <p className="text-xs text-paper/45">
                  {d.type === "monetary"
                    ? "Monetary gift"
                    : `${d.quantity ?? ""} × ${d.item_name}`}
                  {d.category ? ` · ${d.category}` : ""} · {format(new Date(d.received_at), "MMM d, yyyy")}
                </p>
              </div>
              <span className="font-mono text-sm text-gold shrink-0 ml-4">
                {d.type === "monetary" ? `₦${(d.amount ?? 0).toLocaleString()}` : "in-kind"}
              </span>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log a donation">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {(["monetary", "item"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 text-sm rounded-lg py-2 border transition-colors focus-ring ${
                  form.type === t ? "border-gold text-gold bg-gold/10" : "border-paper/15 text-paper/55"
                }`}
              >
                {t === "monetary" ? "Monetary" : "In-kind item"}
              </button>
            ))}
          </div>

          <Field label="Donor name (optional)">
            <input
              value={form.donor_name}
              onChange={(e) => setForm((f) => ({ ...f, donor_name: e.target.value }))}
              placeholder="Anonymous"
              className="input"
            />
          </Field>

          {form.type === "monetary" ? (
            <Field label="Amount (₦)">
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="input"
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Item name">
                <input
                  required
                  value={form.item_name}
                  onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
                  className="input"
                />
              </Field>
              <Field label="Quantity">
                <input
                  type="number"
                  required
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="input"
                />
              </Field>
            </div>
          )}

          <Field label="Category (optional)">
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Clothing, Food, General fund"
              className="input"
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="input resize-none"
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-ink-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-light transition-colors disabled:opacity-60 focus-ring"
          >
            {saving ? "Saving…" : "Save donation"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-wide text-paper/50">{label}</label>
      {children}
    </div>
  );
}
