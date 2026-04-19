import ParticipantFormWrapper from "@/components/wrappers/ParticipantFormWrapper";

export default function Page({ params }: { params: { id: string } }) {
  return <ParticipantFormWrapper mode="edit" id={params.id} />;
}