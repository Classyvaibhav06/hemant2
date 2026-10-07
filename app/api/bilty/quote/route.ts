import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/api-guard";
import { computeCharges, resolveRates } from "@/lib/bilty";

export async function GET(req: NextRequest) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const sp = req.nextUrl.searchParams;
  const vendorId = Number(sp.get("vendor_id"));
  const weight = Number(sp.get("weight")) || 0;
  const parcels = Number(sp.get("parcels")) || 1;
  if (!vendorId || weight <= 0) return NextResponse.json({ error: "vendor_id and weight required" }, { status: 400 });

  const rr = resolveRates(vendorId, weight, parcels);
  if (rr.error) return NextResponse.json({ error: rr.error, rates: null }, { status: 200 });

  const manual = sp.get("manual") === "1";
  const company_rate = manual ? Number(sp.get("company_rate")) || rr.company_rate : rr.company_rate;
  const vendor_rate = manual ? Number(sp.get("vendor_rate")) || rr.vendor_rate : rr.vendor_rate;
  const commission = manual ? Number(sp.get("commission")) || rr.commission : rr.commission;

  const charges = computeCharges({
    chargeable_weight: weight, parcel_count: parcels,
    company_rate, vendor_rate, commission,
    freight: Number(sp.get("freight")) || undefined, loading_charge: Number(sp.get("loading_charge")) || undefined,
    unloading_charge: Number(sp.get("unloading_charge")) || undefined, other_charges: Number(sp.get("other_charges")) || undefined,
    discount: Number(sp.get("discount")) || undefined, cod_amount: Number(sp.get("cod_amount")) || undefined,
  });
  return NextResponse.json({ rates: { ...rr, company_rate, vendor_rate, commission }, charges });
}
