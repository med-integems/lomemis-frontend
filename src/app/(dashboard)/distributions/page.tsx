import { Metadata } from "next";
import { DistributionManagement } from "@/components/distributions/distribution-management";

export const metadata: Metadata = {
  title: "Distributions - LoMEMIS",
  description: "Distribution Management to Schools",
};

export default function DistributionsPage() {
  return <DistributionManagement />;
}
