import { Metadata } from "next";
import { SchoolsForDirectShipments } from "@/components/warehouses/schools-for-direct-shipments";

export const metadata: Metadata = {
  title: "Schools - Direct Shipments - LoMEMIS",
  description: "Manage schools for direct warehouse-to-school shipments",
};

export default function WarehouseSchoolsPage() {
  return <SchoolsForDirectShipments />;
}