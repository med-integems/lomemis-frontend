import { Metadata } from "next";
import { ItemManagement } from "@/components/admin/item-management";

export const metadata: Metadata = {
  title: "Item Master - LoMEMIS",
  description: "Manage items and inventory catalog",
};

export default function ItemMasterPage() {
  return <ItemManagement />;
}
