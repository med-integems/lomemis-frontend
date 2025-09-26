import { Metadata } from "next";
import { DownloadsPage } from "@/components/reports/downloads-page";

export const metadata: Metadata = {
  title: "Export Data - LoMEMIS",
  description: "Export data from LoMEMIS system",
};

export default function ExportDataPage() {
  return <DownloadsPage />;
}
