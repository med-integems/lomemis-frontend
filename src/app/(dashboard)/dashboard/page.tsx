import { Metadata } from "next";
import { MVPDashboard } from "@/components/dashboard/mvp-dashboard";

export const metadata: Metadata = {
  title: "Dashboard Overview - LoMEMIS",
  description: "LoMEMIS Dashboard Overview - Role-specific KPIs and Actions",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <MVPDashboard />
    </div>
  );
}
