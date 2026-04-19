import { redirect } from 'next/navigation';

export default function ActivityEditPage({ params }: { params: { id: string } }) {
  redirect(`/activities/${params.id}/edit/info`);
}