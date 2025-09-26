import { Metadata } from "next";
import { MyReportsPage } from "@/components/reports/my-reports-page";

export const metadata: Metadata = {
  title: "Standard Reports - LoMEMIS",
  description: "Pre-built standard reports for LoMEMIS system",
};

export default function StandardReportsPage() {
  return <MyReportsPage />;
}
