import { redirect } from "next/navigation";

export default async function SchoolInventoryByIdPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  return redirect(`/schools/inventory?schoolId=${encodeURIComponent(schoolId)}`);
}

