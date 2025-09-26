import { Metadata } from "next";
import { ReportBuilderPage } from "@/components/reports/report-builder-page";

export const metadata: Metadata = {
  title: "Custom Reports - LoMEMIS",
  description: "Build custom reports for LoMEMIS system",
};

export default function CustomReportsPage() {
  return <ReportBuilderPage />;
}
