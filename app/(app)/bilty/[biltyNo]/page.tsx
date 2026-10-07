import { BiltyDetailClient } from "./BiltyDetailClient";
import { getSessionUser } from "@/lib/types";
import { cookies } from "next/headers";

export default async function Page({ params }: { params: Promise<{ biltyNo: string }> }) {
  const user = getSessionUser(await cookies())!;
  const { biltyNo } = await params;
  return <BiltyDetailClient biltyNo={biltyNo} role={user.role} />;
}
