import { Metadata } from "next";
import { CouncilManagement } from "@/components/admin/council-management";

export const metadata: Metadata = {
  title: "Council Management - LoMEMIS",
  description: "Local Council Management",
};

export default function CouncilManagementPage() {
  return <CouncilManagement />;
}
