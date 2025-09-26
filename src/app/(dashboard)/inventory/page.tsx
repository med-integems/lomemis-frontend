"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Warehouse, 
  Building2,
  ArrowRight,
  BarChart3,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";

export default function InventoryPage() {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();

  const inventoryModules = [
    {
      title: "National Warehouses",
      description: "View and manage inventory at national warehouse locations",
      href: "/inventory/national",
      icon: Warehouse,
      color: "bg-blue-500",
      roles: ["national_manager", "super_admin"],
    },
    {
      title: "Local Councils",
      description: "Monitor inventory levels and movements at local council facilities",
      href: "/councils/inventory",
      icon: Building2,
      color: "bg-green-500", 
      roles: ["lc_officer", "super_admin"],
    },
  ];

  // Filter modules based on user role
  const availableModules = inventoryModules.filter(module =>
    module.roles.includes(user?.role || '') || user?.role === 'super_admin'
  );

  const quickStats = [
    { label: "Total Stock Items", value: "--", icon: Package },
    { label: "Low Stock Alerts", value: "--", icon: AlertTriangle },
    { label: "Locations Monitored", value: "--", icon: Warehouse },
    { label: "Stock Movements", value: "--", icon: TrendingUp },
  ];

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
        <div className={`flex items-center justify-center bg-blue-100 rounded-lg ${
          isMobile ? 'w-10 h-10' : 'w-12 h-12'
        }`}>
          <Package className={`text-blue-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
        </div>
        <div>
          <h1 className={`font-bold text-foreground ${
            isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
          }`}>TLM Management</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {isMobile 
              ? "Manage TLM inventory across the system" 
              : "Monitor and manage Teaching and Learning Materials inventory across the system"
            }
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={`grid gap-4 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium text-muted-foreground ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      {stat.label}
                    </p>
                    <p className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`text-muted-foreground ${
                    isMobile ? 'w-6 h-6' : 'w-8 h-8'
                  }`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inventory Modules */}
      <div>
        <div className={`flex items-center space-x-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
          <BarChart3 className={`text-muted-foreground ${
            isMobile ? 'w-4 h-4' : 'w-5 h-5'
          }`} />
          <h2 className={`font-semibold ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>Inventory Management</h2>
        </div>
        
        <div className={`grid gap-6 ${
          isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {availableModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                    <div className={`flex items-center justify-center ${module.color} rounded-lg ${
                      isMobile ? 'w-8 h-8' : 'w-10 h-10'
                    }`}>
                      <Icon className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </div>
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                      {module.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                    {module.description}
                  </p>
                  <Link href={module.href}>
                    <Button className={`w-full group ${isMobile ? 'h-12 text-sm' : ''}`}>
                      View {module.title}
                      <ArrowRight className={`ml-2 group-hover:translate-x-1 transition-transform ${
                        isMobile ? 'w-3 h-3' : 'w-4 h-4'
                      }`} />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className={`${isMobile ? 'text-base' : ''}`}>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${
            isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
          }`}>
            {user?.role === 'national_manager' || user?.role === 'super_admin' ? (
              <Link href="/warehouse/receipts">
                <Button variant="outline" className={`w-full justify-start ${
                  isMobile ? 'h-12 text-sm' : ''
                }`}>
                  <Package className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                  Receive New Stock
                </Button>
              </Link>
            ) : null}
            
            {/* <Link href="/reports">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Reports
              </Button>
            </Link> */}

            {user?.role === 'national_manager' || user?.role === 'super_admin' ? (
              <Link href="/warehouse/shipments">
                <Button variant="outline" className={`w-full justify-start ${
                  isMobile ? 'h-12 text-sm' : ''
                }`}>
                  <ArrowRight className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                  Manage Shipments
                </Button>
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
            <Package className={`text-blue-600 mt-0.5 ${
              isMobile ? 'w-4 h-4' : 'w-5 h-5'
            }`} />
            <div>
              <h3 className={`font-medium text-blue-800 ${isMobile ? 'text-sm' : ''}`}>
                Inventory Management
              </h3>
              <p className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile 
                  ? "Real-time TLM visibility across warehouses and councils. Select an option above to view inventory for your authorized locations."
                  : "The TLM Management system provides real-time visibility into Teaching and Learning Materials across national warehouses and local councils. Select an option above to view detailed inventory information for your authorized locations."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}