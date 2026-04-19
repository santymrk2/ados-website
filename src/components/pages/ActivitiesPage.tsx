"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { ActivitiesList } from "@/components/activities/ActivitiesList";

export default function ActivitiesPage() {
  const router = useRouter();
  const { db, deleteActivity, saveActivity, refresh } = useApp();

  const handleView = (activity: any) => {
    router.push(`/activities/${activity.id}`);
  };

  const handleNew = () => {
    router.push(`/activities/new`);
  };

  const handleEdit = (activity: any) => {
    router.push(`/activities/${activity.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    await deleteActivity(id);
  };

  return (
    <ActivitiesList
      db={db}
      onView={handleView}
      onNew={handleNew}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}