import ActivityFormWrapper from "@/components/wrappers/ActivityFormWrapper";

export default function Page({ params }: { params: { id: string; tab: string } }) {
  return <ActivityFormWrapper mode="edit" id={params.id} initialTab={params.tab} />;
}