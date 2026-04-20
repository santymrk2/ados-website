import ParticipantFormWrapper from "@/components/wrappers/ParticipantFormWrapper";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ParticipantFormWrapper mode="edit" id={id} />;
}