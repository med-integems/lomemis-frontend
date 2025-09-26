import { CouncilShipmentManagement } from "@/components/shipments/council-shipment-management";

export const metadata = {
  title: "Local Council Shipment Management - LoMEMIS",
  description: "Confirm and manage shipments received from warehouses",
};

export default function CouncilShipmentsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      <CouncilShipmentManagement />
    </div>
  );
}