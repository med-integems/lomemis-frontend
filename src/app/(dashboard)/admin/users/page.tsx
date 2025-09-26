import { Metadata } from "next";
import { UserManagement } from "@/components/admin/user-management";

export const metadata: Metadata = {
  title: "User Management - LoMEMIS",
  description: "Manage system users and their permissions",
};

export default function UsersPage() {
  return <UserManagement />;
}
