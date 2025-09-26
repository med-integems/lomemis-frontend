import { WarehouseReportsManagement } from "@/components/reports/warehouse-reports-management";

export const metadata = {
  title: "National Warehouse Reports - LoMEMIS",
  description: "Comprehensive warehouse analytics and performance reports",
};

export default function WarehouseReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      <WarehouseReportsManagement />
    </div>
  );
}