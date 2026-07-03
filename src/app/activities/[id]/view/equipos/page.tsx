"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ViewEquiposRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/activities/${params.id}/equipos`);
  }, [params.id, router]);

  return null;
}
