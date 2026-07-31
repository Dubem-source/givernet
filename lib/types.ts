export type DonationType = "monetary" | "item";

export interface Donor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string | null;
  donor_name: string; // denormalized for quick display / anonymous gifts
  type: DonationType;
  amount: number | null; // for monetary
  item_name: string | null; // for item
  quantity: number | null; // for item
  category: string | null;
  notes: string | null;
  received_at: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  updated_at: string;
}

export type VolunteerStatus = "active" | "inactive";

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skills: string[] | null;
  status: VolunteerStatus;
  created_at: string;
}

export type ShiftStatus = "open" | "filled" | "completed" | "cancelled";

export interface Shift {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: ShiftStatus;
  notes: string | null;
  created_at: string;
}

export interface ShiftSignup {
  id: string;
  shift_id: string;
  volunteer_id: string;
  created_at: string;
}
