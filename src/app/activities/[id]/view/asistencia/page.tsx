"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ViewAsistenciaRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/activities/${params.id}/asistencia`);
  }, [params.id, router]);

  return null;
}
