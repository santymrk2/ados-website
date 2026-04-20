import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ActivityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/activities/${id}/edit/info`);
}