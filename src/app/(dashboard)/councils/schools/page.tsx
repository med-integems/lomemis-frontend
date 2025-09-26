import { Metadata } from "next";
import { SchoolsInCouncils } from "@/components/councils/schools-in-councils";

export const metadata: Metadata = {
  title: "Schools - Council Distributions - LoMEMIS",
  description: "Manage schools for local council distributions",
};

export default function CouncilSchoolsPage() {
  return <SchoolsInCouncils />;
}