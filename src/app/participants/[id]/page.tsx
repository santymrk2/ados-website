import PlayerDetailWrapper from "@/components/wrappers/PlayerDetailWrapper";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlayerDetailWrapper id={id} />;
}