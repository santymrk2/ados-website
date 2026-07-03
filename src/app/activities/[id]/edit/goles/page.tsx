"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditGolesRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/activities/${params.id}/goles`);
  }, [params.id, router]);

  return null;
}
