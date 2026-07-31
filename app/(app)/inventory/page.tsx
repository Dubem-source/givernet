"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import { Plus, PackageSearch, Minus, ChevronUp } from "lucide-react";
import type { InventoryItem } from "@/lib/types";

const emptyForm = { name: "", category: "", quantity: "", unit: "units", low_stock_threshold: "5" };

export default function InventoryPage() {
  const supabase = createClient();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("inventory_items").select("*").order("name");
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("inventory_items").insert({
      name: form.name,
      category: form.category || "General",
      quantity: Number(form.quantity),
      unit: form.unit || "units",
      low_stock_threshold: Number(form.low_stock_threshold),
    });
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    load();
  }

  async function adjustQuantity(item: InventoryItem, delta: number) {
    const newQty = Math.max(0, item.quantity + delta);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)));
    await supabase.from("inventory_items").update({ quantity: newQty, updated_at: new Date().toISOString() }).eq("id", item.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold mb-1.5">Stock</p>
          <h1 className="font-display text-3xl">Inventory</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gold text-ink-900 font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-gold-light transition-colors focus-ring"
        >
          <Plus size={16} /> Add item
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-paper/45">Loading…</p>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
          <PackageSearch className="text-paper/20 mb-4" size={48} />
          <p className="text-sm text-paper/45 max-w-sm">No inventory tracked yet. Item donations can be added here as stock.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const low = item.quantity <= item.low_stock_threshold;
            return (
              <div key={item.id} className={`glass rounded-2xl p-5 ${low ? "border-coral/30" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-paper/45">{item.category}</p>
                  </div>
                  {low && <span className="text-[10px] uppercase tracking-wide text-coral bg-coral/10 rounded-full px-2 py-1">Low</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl">
                    {item.quantity} <span className="text-sm text-paper/40">{item.unit}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustQuantity(item, -1)}
                      className="rounded-md p-1.5 border border-paper/15 hover:border-paper/30 transition-colors focus-ring"
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => adjustQuantity(item, 1)}
                      className="rounded-md p-1.5 border border-paper/15 hover:border-paper/30 transition-colors focus-ring"
                      aria-label={`Increase ${item.name}`}
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add inventory item">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Item name">
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="General" className="input" />
            </Field>
            <Field label="Unit">
              <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="units, boxes, kg…" className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting quantity">
              <input type="number" required min="0" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="input" />
            </Field>
            <Field label="Low stock alert below">
              <input type="number" required min="0" value={form.low_stock_threshold} onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))} className="input" />
            </Field>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-ink-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-light transition-colors disabled:opacity-60 focus-ring"
          >
            {saving ? "Saving…" : "Add to inventory"}
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
