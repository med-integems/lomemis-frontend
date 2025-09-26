import { Metadata } from "next";
import { SchoolManagement } from "@/components/admin/school-management";

export const metadata: Metadata = {
  title: "School Management - LoMEMIS",
  description: "School Management and Assignment",
};

export default function SchoolManagementPage() {
  return <SchoolManagement />;
}
