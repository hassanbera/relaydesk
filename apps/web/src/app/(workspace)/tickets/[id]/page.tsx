import { TicketDetailView } from "@/features/tickets/ticket-detail";
export const metadata = { title: "Talep ayrıntıları" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const safeReturn =
    returnTo === "/tickets" || returnTo?.startsWith("/tickets?")
      ? returnTo
      : "/tickets";
  return <TicketDetailView id={id} returnTo={safeReturn} />;
}
