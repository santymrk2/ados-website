"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditInvitadosRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/activities/${params.id}/invitaciones`);
  }, [params.id, router]);

  return null;
}
