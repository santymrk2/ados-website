import ActivityPage from "@/components/pages/ActivityPage";

export default function Page({ params }: { params: { id: string; tab: string } }) {
  return <ActivityPage id={params.id} initialTab={params.tab} />;
}