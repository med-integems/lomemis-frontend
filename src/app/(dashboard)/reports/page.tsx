import { Metadata } from "next";
import { ReportsLandingPage } from "@/components/reports/reports-landing-page";

export const metadata: Metadata = {
  title: "Reports - LoMEMIS",
  description: "System Reports and Analytics",
};

export default function ReportsPage() {
  return <ReportsLandingPage />;
}
