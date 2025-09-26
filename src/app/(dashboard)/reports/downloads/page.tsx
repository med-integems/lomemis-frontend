import { Metadata } from "next";
import { DownloadsPage } from "@/components/reports/downloads-page";

export const metadata: Metadata = {
  title: "Downloads - LoMEMIS",
  description: "Download and manage your reports",
};

export default function Downloads() {
  return <DownloadsPage />;
}