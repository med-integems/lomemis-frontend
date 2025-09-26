"use client";

import { CouncilDistributionManagement } from "@/components/distributions/council-distribution-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, School, Building2 } from "lucide-react";

export default function CouncilDistributionsPage() {
  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg">
          <Truck className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Distributions to Schools</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Create and manage distributions from your local council to schools
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3 lg:p-4">
          <div className="flex items-start space-x-3">
            <School className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1 text-sm lg:text-base">Distribution Workflow</h3>
              <p className="text-xs lg:text-sm text-blue-700">
                Create distributions to deliver educational materials from your council inventory 
                to schools within your jurisdiction. Schools will confirm receipt of these distributions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Management */}
      <CouncilDistributionManagement />
    </div>
  );
}