import ActivityFormWrapper from "@/components/wrappers/ActivityFormWrapper";

export default function Page({ params }: { params: { tab: string } }) {
  return <ActivityFormWrapper mode="new" initialTab={params.tab} />;
}