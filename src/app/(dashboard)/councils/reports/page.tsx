import { CouncilReportsManagement } from "@/components/reports/council-reports-management";

export const metadata = {
  title: "Council Reports - LoMEMIS",
  description: "Generate and view reports for local council operations",
};

export default function CouncilReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      <CouncilReportsManagement />
    </div>
  );
}