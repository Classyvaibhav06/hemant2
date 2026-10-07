import { getDbInstance, BILTY_STATUSES } from "@/lib/db";
import type { BiltyStatus } from "@/lib/db";

export type BiltyInput = {
  customer_id: number; vendor_id: number;
  sender_name: string; sender_mobile?: string; sender_address?: string;
  receiver_name: string; receiver_mobile?: string; receiver_address?: string;
  from_city: string; to_city: string; parcel_type: string;
  parcel_count: number; actual_weight: number; chargeable_weight: number;
  freight?: number; loading_charge?: number; unloading_charge?: number; other_charges?: number;
  discount?: number; cod_amount?: number; payment_mode?: string; remarks?: string;
  booking_date?: string; force_rate?: boolean;
};

export type RateChoice = {
  rate_config_id: number | null;
  company_rate: number;   // ₹/kg we charge customer
  vendor_rate: number;    // ₹/kg we pay vendor
  commission: number;
};

/**
 * Resolve the active rate for a vendor at the given chargeable weight.
 * All suitable active slabs are considered (smallest range covering w wins,
 * then lowest value). Vendor's default commission is folded in implicitly by
 * using the matching slab — rate master cannot be passed per-bilty directly.
 */
export function resolveRates(
  vendorId: number,
  chargeableWeight: number,
  parcelCount: number
): RateChoice & { error?: string } {
  const db = getDbInstance();
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT rc.* FROM rate_configs rc
    WHERE rc.vendor_id = ? AND rc.active = 1
      AND (rc.valid_from IS NULL OR rc.valid_from <= ?)
      AND (rc.valid_to IS NULL OR rc.valid_to >= ? OR rc.valid_to = '')
  `).all(vendorId, today, today) as any[];
  // fall back: if no rows have valid_from concept, match all active for vendor
  const candidates = (rows.length ? rows : db.prepare(
    "SELECT * FROM rate_configs WHERE vendor_id = ? AND active = 1"
  ).all(vendorId) as any[]);
  const fits = candidates.filter((r) => {
    if (r.min_weight && chargeableWeight < r.min_weight) return false;
    if (r.max_weight && chargeableWeight > r.max_weight) return false;
    return true;
  });
  if (!fits.length) return { rate_config_id: null, company_rate: 0, vendor_rate: 0, commission: 0, error: "No active rate slab for this vendor/weight" };
  // smallest slab range wins
  const best = fits.sort((a, b) => (a.max_weight && b.max_weight
    ? (a.max_weight - b.max_weight)
    : (b.max_weight ? 1 : -1)))[0];
  const n = Number(best.commission_value) || 0;
  let company_rate = 0, vendor_rate = 0, commission = 0;
  switch (best.commission_type) {
    case "PER_PARCEL":
      company_rate = 0; vendor_rate = 0;
      commission = n * parcelCount;
      break;
    case "PER_KG":
      company_rate = n; vendor_rate = n;
      commission = 0;
      break;
    case "FIXED":
      company_rate = 0; vendor_rate = 0;
      commission = n;
      break;
    case "PERCENT":
      company_rate = 0; vendor_rate = 0;
      commission = 0;
      break;
    case "SLAB":
      company_rate = n; vendor_rate = n * 0.8; // vendor at 80% of company rate
      commission = 0;
      break;
    default:
      return { rate_config_id: null, company_rate: 0, vendor_rate: 0, commission: 0, error: `Unknown commission_type ${best.commission_type}` };
  }
  return { rate_config_id: best.id, company_rate: round2(company_rate), vendor_rate: round2(vendor_rate), commission: round2(commission) };
}

/** Compute all derived money fields for a bilty. */
export function computeCharges(input: {
  chargeable_weight: number; parcel_count: number;
  company_rate: number; vendor_rate: number; commission: number;
  freight?: number; loading_charge?: number; unloading_charge?: number; other_charges?: number;
  discount?: number; cod_amount?: number;
}) {
  const w = Number(input.chargeable_weight) || 0;
  const customer_amount = round2(Number(input.company_rate) * w);
  const vendor_amount = round2(Number(input.vendor_rate) * w);
  const commission = round2(Number(input.commission) || 0);
  const loading = round2(Number(input.loading_charge) || 0);
  const unloading = round2(Number(input.unloading_charge) || 0);
  const other = round2(Number(input.other_charges) || 0);
  const discount = round2(Number(input.discount) || 0);
  const freight = round2(Number(input.freight) || 0);
  const total_charges = round2(customer_amount + freight + loading + unloading + other - discount);
  const vendor_cost = round2(vendor_amount + loading + unloading + other);
  const gross_margin = round2(customer_amount - vendor_amount);
  const net_amount = round2(total_charges - vendor_cost);
  return { customer_amount, vendor_amount, commission, total_charges, vendor_cost, gross_margin, net_amount, discount, freight };
}

export function round2(x: number): number {
  return Math.round((Number(x) || 0) * 100) / 100;
}

export function generateBiltyNo(db = getDbInstance()): string {
  const today = new Date();
  const ym = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  const row = db.prepare("SELECT COUNT(*) c FROM bilty WHERE bilty_no LIKE ?").get(`${ym}-%`) as { c: number };
  let seq = row.c + 1;
  // guarantee uniqueness even after deletes during dev
  let candidate = `${ym}-${String(seq).padStart(5, "0")}`;
  while (db.prepare("SELECT 1 FROM bilty WHERE bilty_no = ?").get(candidate)) {
    seq += 1;
    candidate = `${ym}-${String(seq).padStart(5, "0")}`;
  }
  return candidate;
}

const IDX: Record<BiltyStatus, number> = {
  BOOKED: 0, DISPATCHED: 1, IN_TRANSIT: 2, AT_DESTINATION: 3, OUT_FOR_DELIVERY: 4, DELIVERED: 5, UNDELIVERED: 4.5,
};

export function canTransition(from: BiltyStatus, to: BiltyStatus): boolean {
  if (!(from in IDX) || !(to in IDX)) return false;
  if (from === to) return false;
  // Undelivered is only reachable from OUT_FOR_DELIVERY (failed attempt)
  if (to === "UNDELIVERED" && from !== "OUT_FOR_DELIVERY") return false;
  // Can't go backward
  if (IDX[to] < IDX[from]) return false;
  // Can't deliver twice, only from valid prior states
  if (to === "DELIVERED" && !(["OUT_FOR_DELIVERY", "AT_DESTINATION", "IN_TRANSIT", "DISPATCHED"].includes(from))) return false;
  return true;
}

export function nextStatuses(cur: BiltyStatus): BiltyStatus[] {
  return BILTY_STATUSES.filter((s) => s !== cur && canTransition(cur, s));
}

export function statusLabel(s: BiltyStatus): string {
  const L: Record<BiltyStatus, string> = {
    BOOKED: "Booked", DISPATCHED: "Dispatched", IN_TRANSIT: "In Transit",
    AT_DESTINATION: "At Destination", OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered", UNDELIVERED: "Undelivered",
  };
  return L[s] ?? s;
}
