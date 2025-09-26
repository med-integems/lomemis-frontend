import { Metadata } from "next";
import { MyReportsPage } from "@/components/reports/my-reports-page";

export const metadata: Metadata = {
  title: "My Reports - LoMEMIS",
  description: "Your role-specific reports and favorites",
};

export default function MyReports() {
  return <MyReportsPage />;
}