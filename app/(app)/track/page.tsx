import { TrackingClient } from "./TrackingClient";
import { getSessionUser } from "@/lib/types";
import { cookies } from "next/headers";

export default async function Page() {
  const user = getSessionUser(await cookies())!;
  return <TrackingClient role={user.role} />;
}
