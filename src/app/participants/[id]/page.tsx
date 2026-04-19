import PlayerDetailWrapper from "@/components/wrappers/PlayerDetailWrapper";

export default function Page({ params }: { params: { id: string } }) {
  return <PlayerDetailWrapper id={params.id} />;
}