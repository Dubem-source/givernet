"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";
import { Plus, CalendarClock, MapPin, UserPlus, X } from "lucide-react";
import { format } from "date-fns";
import type { Shift, Volunteer, ShiftSignup } from "@/lib/types";

const emptyForm = { title: "", location: "", starts_at: "", ends_at: "", capacity: "1", notes: "" };

type ShiftWithSignups = Shift & { signups: (ShiftSignup & { volunteer: Volunteer | null })[] };

export default function ShiftsPage() {
  const supabase = createClient();
  const [shifts, setShifts] = useState<ShiftWithSignups[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [assignShiftId, setAssignShiftId] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");

  async function load() {
    setLoading(true);
    const [shiftsRes, volunteersRes, signupsRes] = await Promise.all([
      supabase.from("shifts").select("*").order("starts_at"),
      supabase.from("volunteers").select("*").eq("status", "active").order("name"),
      supabase.from("shift_signups").select("*, volunteer:volunteers(*)"),
    ]);
    const shiftsData = shiftsRes.data ?? [];
    const signups = signupsRes.data ?? [];
    setShifts(
      shiftsData.map((s: Shift) => ({
        ...s,
        signups: signups.filter((su: ShiftSignup) => su.shift_id === s.id),
      }))
    );
    setVolunteers(volunteersRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("shifts").insert({
      title: form.title,
      location: form.location || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      capacity: Number(form.capacity),
      notes: form.notes || null,
    });
    setSaving(false);
    setOpen(false);
    setForm(emptyForm);
    load();
  }

  async function assignVolunteer(shift: ShiftWithSignups) {
    if (!selectedVolunteer) return;
    await supabase.from("shift_signups").insert({ shift_id: shift.id, volunteer_id: selectedVolunteer });
    if (shift.signups.length + 1 >= shift.capacity) {
      await supabase.from("shifts").update({ status: "filled" }).eq("id", shift.id);
    }
    setAssignShiftId(null);
    setSelectedVolunteer("");
    load();
  }

  async function removeSignup(shift: ShiftWithSignups, signupId: string) {
    await supabase.from("shift_signups").delete().eq("id", signupId);
    if (shift.status === "filled") {
      await supabase.from("shifts").update({ status: "open" }).eq("id", shift.id);
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold mb-1.5">Schedule</p>
          <h1 className="font-display text-3xl">Volunteer shifts</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gold text-ink-900 font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-gold-light transition-colors focus-ring"
        >
          <Plus size={16} /> New shift
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-paper/45">Loading…</p>
      ) : shifts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <CalendarClock className="mx-auto text-paper/20 mb-3" size={32} />
          <p className="text-sm text-paper/45">No shifts scheduled yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {shifts.map((s) => (
            <div key={s.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-sm">{s.title}</p>
                <span
                  className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-1 ${
                    s.status === "open"
                      ? "text-sage bg-sage/10"
                      : s.status === "filled"
                      ? "text-gold bg-gold/10"
                      : "text-paper/40 bg-paper/5"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-paper/55 flex items-center gap-1.5">
                <CalendarClock size={12} /> {format(new Date(s.starts_at), "EEE MMM d, h:mm a")} – {format(new Date(s.ends_at), "h:mm a")}
              </p>
              {s.location && (
                <p className="text-xs text-paper/55 flex items-center gap-1.5 mt-1">
                  <MapPin size={12} /> {s.location}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-paper/10">
                <p className="text-xs text-paper/45 mb-2">
                  {s.signups.length} / {s.capacity} filled
                </p>
                <div className="space-y-1.5">
                  {s.signups.map((su) => (
                    <div key={su.id} className="flex items-center justify-between text-xs bg-paper/5 rounded-lg px-2.5 py-1.5">
                      <span>{su.volunteer?.name ?? "Unknown"}</span>
                      <button
                        onClick={() => removeSignup(s, su.id)}
                        className="text-paper/40 hover:text-coral transition-colors focus-ring rounded"
                        aria-label="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {s.signups.length < s.capacity && (
                  <>
                    {assignShiftId === s.id ? (
                      <div className="flex gap-2 mt-2">
                        <select
                          value={selectedVolunteer}
                          onChange={(e) => setSelectedVolunteer(e.target.value)}
                          className="input flex-1 text-xs py-1.5"
                        >
                          <option value="">Choose volunteer…</option>
                          {volunteers
                            .filter((v) => !s.signups.some((su) => su.volunteer_id === v.id))
                            .map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => assignVolunteer(s)}
                          className="text-xs bg-gold text-ink-900 font-semibold rounded-lg px-3 focus-ring"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssignShiftId(s.id)}
                        className="flex items-center gap-1.5 text-xs text-gold mt-2.5 hover:text-gold-light transition-colors focus-ring rounded"
                      >
                        <UserPlus size={13} /> Assign volunteer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Schedule a shift">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Shift title">
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Food pantry sorting" className="input" />
          </Field>
          <Field label="Location (optional)">
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <input type="datetime-local" required value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} className="input" />
            </Field>
            <Field label="Ends">
              <input type="datetime-local" required value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} className="input" />
            </Field>
          </div>
          <Field label="Volunteers needed">
            <input type="number" required min="1" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className="input" />
          </Field>
          <Field label="Notes (optional)">
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="input resize-none" />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-ink-900 font-semibold rounded-lg py-2.5 text-sm hover:bg-gold-light transition-colors disabled:opacity-60 focus-ring"
          >
            {saving ? "Saving…" : "Create shift"}
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
