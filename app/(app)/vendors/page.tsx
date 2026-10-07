import { VendorsClient } from "./VendorsClient";
import { getSessionUser } from "@/lib/types";
import { cookies } from "next/headers";

export default async function Page() {
  const user = getSessionUser(await cookies())!;
  return <VendorsClient role={user.role} />;
}
