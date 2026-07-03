"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditExtrasRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/activities/${params.id}/extras`);
  }, [params.id, router]);

  return null;
}
