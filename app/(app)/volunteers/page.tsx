"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import { Plus, Users, Mail, Phone } from "lucide-react";
import type { Volunteer } from "@/lib/types";

const emptyForm = { name: "", email: "", phone: "", skills: "" };

export default function VolunteersPage() {
  const supabase = createClient();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("volunteers").select("*").order("name");
    setVolunteers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("volunteers").insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : null,
    });
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    load();
  }

  async function toggleStatus(v: Volunteer) {
    const newStatus = v.status === "active" ? "inactive" : "active";
    setVolunteers((prev) => prev.map((x) => (x.id === v.id ? { ...x, status: newStatus } : x)));
    await supabase.from("volunteers").update({ status: newStatus }).eq("id", v.id);
  }

  const filtered = statusFilter === "all" ? volunteers : volunteers.filter((v) => v.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold mb-1.5">Roster</p>
          <h1 className="font-display text-3xl">Volunteers</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gold text-ink-900 font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-gold-light transition-colors focus-ring"
        >
          <Plus size={16} /> Add volunteer
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize focus-ring ${
              statusFilter === f ? "border-gold text-gold bg-gold/10" : "border-paper/15 text-paper/55 hover:text-paper"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-paper/45">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="mx-auto text-paper/20 mb-3" size={32} />
          <p className="text-sm text-paper/45">No volunteers on the roster yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="font-medium text-sm">{v.name}</p>
                <button
                  onClick={() => toggleStatus(v)}
                  className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-1 transition-colors focus-ring ${
                    v.status === "active" ? "text-sage bg-sage/10" : "text-paper/40 bg-paper/5"
                  }`}
                >
                  {v.status}
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-paper/55">
                <div className="flex items-center gap-1.5">
                  <Mail size={12} /> {v.email}
                </div>
                {v.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} /> {v.phone}
                  </div>
                )}
              </div>
              {v.skills && v.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {v.skills.map((s) => (
                    <span key={s} className="text-[10px] bg-paper/5 border border-paper/10 rounded-full px-2 py-0.5 text-paper/60">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add a volunteer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" />
          </Field>
          <Field label="Email">
            <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input" />
          </Field>
          <Field label="Phone (optional)">
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input" />
          </Field>
          <Field label="Skills (comma separated, optional)">
            <input
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              placeholder="e.g. Driving, First aid, Sorting"
              className="input"
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-ink-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-light transition-colors disabled:opacity-60 focus-ring"
          >
            {saving ? "Saving…" : "Add volunteer"}
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
