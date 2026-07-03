"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ViewRankingRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/activities/${params.id}/asistencia`);
  }, [params.id, router]);

  return null;
}
