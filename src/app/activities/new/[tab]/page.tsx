import ActivityFormWrapper from "@/components/wrappers/ActivityFormWrapper";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  return <ActivityFormWrapper mode="new" initialTab={tab} />;
}