import { getDbInstance } from "@/lib/db";
import type { BiltyStatus } from "@/lib/db";

export type Customer = {
  id: number; code: string; name: string; company?: string; mobile?: string; mobile2?: string;
  address?: string; city?: string; state?: string; pincode?: string; gstin?: string; email?: string;
  credit_limit: number; opening_balance: number; payment_terms?: string; notes?: string; status: string;
};
export type Vendor = {
  id: number; code: string; name: string; company?: string; mobile?: string;
  address?: string; city?: string; state?: string; pincode?: string; gstin?: string;
  opening_balance: number; payment_terms?: string; status: string;
};
export type RateConfig = {
  id: number; vendor_id: number; name: string; commission_type: string; commission_value: number;
  min_weight: number; max_weight: number; active: number; created_at: string;
};
export type Bilty = {
  id: number; bilty_no: string; booking_date: string; booking_time: string; status: BiltyStatus;
  customer_id: number; vendor_id: number;
  sender_name: string; sender_mobile?: string; sender_address?: string;
  receiver_name: string; receiver_mobile?: string; receiver_address?: string;
  from_city: string; to_city: string; parcel_type: string; parcel_count: number;
  actual_weight: number; chargeable_weight: number; rate_config_id?: number;
  company_rate: number; vendor_rate: number;
  freight: number; loading_charge: number; unloading_charge: number; other_charges: number;
  discount: number; cod_amount: number; payment_mode?: string; remarks?: string;
  customer_amount: number; vendor_amount: number; commission: number;
  total_charges: number; vendor_cost: number; gross_margin: number; net_amount: number;
  created_by?: string; created_at: string;
};
export type StatusHistoryRow = { id: number; bilty_id: number; status: string; at: string; by?: string; note?: string };
export type DispatchRow = {
  id: number; bilty_id: number; dispatch_date: string; vehicle_no: string; driver: string;
  manifest_no: string; route?: string; dispatch_branch?: string; remarks?: string; dispatched_by?: string;
};
export type AuditRow = { id: number; at: string; username: string; action: string; entity: string; entity_id?: string; details?: string };
export type SessionUser = { id: number; username: string; name: string; role: Role };
export type Role =
  | "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "BOOKING_STAFF"
  | "DISPATCH_STAFF" | "DELIVERY_STAFF" | "ACCOUNTS_STAFF" | "VIEWER";

// Fine-grained permission map. Actions: view/add/edit/delete/print/payment/approval
type Action = "view" | "add" | "edit" | "delete" | "print" | "payment" | "approval" | "dispatch" | "track" | "reports";
const PERMS: Record<Role, Partial<Record<Action, boolean>>> = {
  SUPER_ADMIN:     { view: true, add: true, edit: true, delete: true, print: true, payment: true, approval: true, dispatch: true, track: true, reports: true },
  ADMIN:           { view: true, add: true, edit: true, delete: true, print: true, payment: true, approval: true, dispatch: true, track: true, reports: true },
  MANAGER:         { view: true, add: true, edit: true, print: true, approval: true, dispatch: true, track: true, reports: true },
  BOOKING_STAFF:   { view: true, add: true, edit: true, print: true, track: true },
  DISPATCH_STAFF:  { view: true, add: true, edit: true, print: true, dispatch: true, track: true },
  DELIVERY_STAFF:  { view: true, edit: true, track: true },
  ACCOUNTS_STAFF:  { view: true, edit: true, print: true, payment: true, reports: true },
  VIEWER:          { view: true },
};
export function can(role: Role, action: Action): boolean {
  return !!PERMS[role]?.[action];
}

export function getSessionUser(cookies: { get(name: string): { value: string } | undefined }): SessionUser | null {
  const token = cookies.get("fd_session")?.value;
  if (!token) return null;
  const db = getDbInstance();
  const row = db.prepare(`
    SELECT u.id, u.username, u.name, u.role FROM session_tokens t
    JOIN users u ON u.id = t.user_id WHERE t.token = ?`).get(token) as SessionUser | undefined;
  return row ?? null;
}

export type { Action };
