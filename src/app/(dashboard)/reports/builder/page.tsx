import { Metadata } from "next";
import { ReportBuilderPage } from "@/components/reports/report-builder-page";

export const metadata: Metadata = {
  title: "Report Builder - LoMEMIS",
  description: "Create custom reports with advanced filtering",
};

export default function ReportBuilder() {
  return <ReportBuilderPage />;
}