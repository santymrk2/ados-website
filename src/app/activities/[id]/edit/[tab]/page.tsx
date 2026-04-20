import ActivityFormWrapper from "@/components/wrappers/ActivityFormWrapper";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string; tab: string }> }) {
  const { id, tab } = await params;
  return <ActivityFormWrapper mode="edit" id={id} initialTab={tab} />;
}