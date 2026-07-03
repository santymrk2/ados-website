"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditBibliaRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/activities/${params.id}/biblia`);
  }, [params.id, router]);

  return null;
}
