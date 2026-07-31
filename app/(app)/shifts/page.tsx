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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    setDropdownOpen(false);
    setSearchQuery("");
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
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
          <CalendarClock className="text-paper/20 mb-4" size={48} />
          <p className="text-sm text-paper/45 max-w-sm">No shifts scheduled yet.</p>
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
                      <div className="flex gap-2 mt-2 items-start relative">
                        <div className="relative flex-1">
                          <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-full flex items-center justify-between bg-ink-700 border border-paper/10 rounded-lg px-3 py-2 text-xs text-left focus-ring outline-none text-paper"
                          >
                            <span>
                              {selectedVolunteer
                                ? volunteers.find((v) => v.id === selectedVolunteer)?.name
                                : "Choose volunteer…"}
                            </span>
                            <span className="text-paper/40 font-mono text-[9px]">▼</span>
                          </button>

                          {dropdownOpen && (
                            <div className="absolute left-0 right-0 z-30 mt-1 bg-ink-850 border border-paper/15 rounded-lg shadow-xl overflow-hidden max-h-56 flex flex-col">
                              <div className="p-1.5 border-b border-paper/10 bg-ink-900/40">
                                <input
                                  type="text"
                                  placeholder="Search name or skills..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full bg-ink-700/60 border border-paper/5 rounded-md px-2 py-1 text-xs outline-none text-paper placeholder:text-paper/30"
                                />
                              </div>
                              <div className="overflow-y-auto flex-1 py-1 max-h-40 scrollbar-thin">
                                {volunteers
                                  .filter((v) => !s.signups.some((su) => su.volunteer_id === v.id))
                                  .filter((v) => {
                                    const matchStr = `${v.name} ${v.skills?.join(" ") || ""}`.toLowerCase();
                                    return matchStr.includes(searchQuery.toLowerCase());
                                  })
                                  .map((v) => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedVolunteer(v.id);
                                        setDropdownOpen(false);
                                        setSearchQuery("");
                                      }}
                                      className={`w-full flex flex-col items-start px-3 py-2 text-left hover:bg-gold/10 transition-colors border-b border-paper/5 last:border-0 ${
                                        selectedVolunteer === v.id ? "bg-gold/15 text-gold" : "text-paper"
                                      }`}
                                    >
                                      <span className="text-xs font-medium">{v.name}</span>
                                      {v.skills && v.skills.length > 0 && (
                                        <span className="flex flex-wrap gap-1 mt-1">
                                          {v.skills.slice(0, 2).map((skill) => (
                                            <span
                                              key={skill}
                                              className="text-[9px] bg-paper/5 border border-paper/10 text-paper/50 rounded-full px-1.5 py-0.5"
                                            >
                                              {skill}
                                            </span>
                                          ))}
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                {volunteers
                                  .filter((v) => !s.signups.some((su) => su.volunteer_id === v.id))
                                  .filter((v) => {
                                    const matchStr = `${v.name} ${v.skills?.join(" ") || ""}`.toLowerCase();
                                    return matchStr.includes(searchQuery.toLowerCase());
                                  }).length === 0 && (
                                  <div className="px-3 py-3 text-center text-xs text-paper/40">
                                    No matching volunteers
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => assignVolunteer(s)}
                          className="text-xs bg-gold text-ink-900 font-semibold rounded-lg px-4 py-2 hover:bg-gold-light transition-colors focus-ring"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAssignShiftId(s.id);
                          setDropdownOpen(true);
                        }}
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
