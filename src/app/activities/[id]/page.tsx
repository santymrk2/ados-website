import { redirect } from 'next/navigation';

export default function ActivityPage({ params }: { params: { id: string } }) {
  redirect(`/activities/${params.id}/view/equipos`);
}