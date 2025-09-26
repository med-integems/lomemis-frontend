import { redirect } from "next/navigation";

export default async function SchoolReceiptsByIdPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  // Redirect to the non-parameter page with a query param. The page
  // at /schools/receipts already understands ?schoolId= and renders accordingly.
  return redirect(`/schools/receipts?schoolId=${encodeURIComponent(schoolId)}`);
}

