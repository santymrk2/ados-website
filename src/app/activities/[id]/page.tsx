import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/activities/${id}/view/equipos`);
}