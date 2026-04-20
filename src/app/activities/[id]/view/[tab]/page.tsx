import ActivityPage from "@/components/pages/ActivityPage";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string; tab: string }> }) {
  const { id, tab } = await params;
  return <ActivityPage id={id} initialTab={tab} />;
}