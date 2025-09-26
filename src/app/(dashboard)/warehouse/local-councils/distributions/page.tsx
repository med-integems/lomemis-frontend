import { CouncilDistributionManagement } from "@/components/distributions/council-distribution-management";

export const metadata = {
  title: "Local Council Distribution Management - LoMEMIS",
  description: "Manage educational material distributions for local councils",
};

export default function CouncilDistributionsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      <CouncilDistributionManagement />
    </div>
  );
}