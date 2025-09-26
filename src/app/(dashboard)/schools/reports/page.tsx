import { SchoolReportsManagement } from "@/components/reports/school-reports-management";

export const metadata = {
  title: "School Reports - LoMEMIS",
  description: "Comprehensive school performance and utilization analytics",
};

export default function SchoolReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      <SchoolReportsManagement />
    </div>
  );
}