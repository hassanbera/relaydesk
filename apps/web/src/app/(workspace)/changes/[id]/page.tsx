import { ChangeDetailView } from "@/features/changes/change-detail";
export const metadata = { title: "Değişiklik ayrıntıları" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChangeDetailView id={id} />;
}
