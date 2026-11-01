import { Suspense } from "react";
import { TicketsRoute } from "@/features/tickets/tickets-view";
import { Loading } from "@/components/common";
export const metadata = { title: "Talep kuyruğu" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TicketsRoute />
    </Suspense>
  );
}
