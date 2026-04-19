import { redirect } from 'next/navigation';

export default function NewActivityPage() {
  redirect("/activities/new/info");
}