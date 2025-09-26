import { Metadata } from "next";
import { MVPDashboard } from "@/components/dashboard/mvp-dashboard";

export const metadata: Metadata = {
  title: "Dashboard - LoMEMIS",
  description: "LoMEMIS Dashboard - Role-specific Overview and Actions",
};

export default function MainDashboardPage() {
  return <MVPDashboard />;
}