import { Metadata } from "next";
import { WarehouseManagement } from "@/components/admin/warehouse-management";

export const metadata: Metadata = {
  title: "Warehouse Management - LoMEMIS",
  description: "Manage warehouses and storage facilities",
};

export default function WarehouseManagementPage() {
  return <WarehouseManagement />;
}