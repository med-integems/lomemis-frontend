"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Warehouse, 
  Building2,
  Users,
  ArrowRight,
  Package,
  Truck,
  CheckCircle,
  FileBarChart,
  ShipIcon as Ship,
  MapPin
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import { useWarehouseStats } from "@/hooks/useStatistics";

export default function WarehousePage() {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  const { stats: warehouseStats } = useWarehouseStats();

  const warehouseModules = [
    {
      title: "Warehouse Receipts",
      description: "Record receipt of educational materials from suppliers",
      href: "/warehouse/receipts",
      icon: CheckCircle,
      color: "bg-blue-500",
      roles: ["warehouse_manager", "super_admin"],
    },
    {
      title: "Direct Shipments",
      description: "Create and manage direct shipments to schools",
      href: "/warehouse/direct-shipments",
      icon: Ship,
      color: "bg-green-500",
      roles: ["warehouse_manager", "super_admin"],
    },
    {
      title: "Local Council Shipments",
      description: "Manage shipments to local councils",
      href: "/warehouse/local-councils/shipments", 
      icon: Truck,
      color: "bg-purple-500",
      roles: ["warehouse_manager", "super_admin"],
    },
    {
      title: "Local Council Distributions",
      description: "Monitor distributions from local councils to schools",
      href: "/warehouse/local-councils/distributions",
      icon: MapPin,
      color: "bg-orange-500",
      roles: ["warehouse_manager", "super_admin", "view_only"],
    },
    {
      title: "Warehouse Reports",
      description: "View warehouse-specific performance and analytics reports",
      href: "/warehouse/local-councils/reports",
      icon: FileBarChart,
      color: "bg-indigo-500",
      roles: ["warehouse_manager", "super_admin", "view_only"],
    },
  ];

  // Filter modules based on user role
  const availableModules = warehouseModules.filter(module =>
    module.roles.includes(user?.role || '') || user?.role === 'super_admin'
  );

  const quickStats = [
    { label: "Total Items", value: warehouseStats[0]?.value || "--", icon: Package },
    { label: "Active Shipments", value: warehouseStats[1]?.value || "--", icon: Truck },
    { label: "Pending Receipts", value: warehouseStats[2]?.value || "--", icon: CheckCircle },
    { label: "Local Councils", value: warehouseStats[3]?.value || "--", icon: Building2 },
  ];

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
        <div className={`flex items-center justify-center bg-orange-100 rounded-lg ${
          isMobile ? 'w-10 h-10' : 'w-12 h-12'
        }`}>
          <Warehouse className={`text-orange-600 ${
            isMobile ? 'w-5 h-5' : 'w-6 h-6'
          }`} />
        </div>
        <div>
          <h1 className={`font-bold text-foreground ${
            isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
          }`}>National Warehouse</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {isMobile 
              ? "Manage inventory and shipments to councils and schools" 
              : "Manage national inventory and coordinate shipments to local councils and schools"
            }
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Warehouse Modules */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Package className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Warehouse Operations</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-10 h-10 ${module.color} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {module.description}
                  </p>
                  <Link href={module.href}>
                    <Button className="w-full group">
                      Access {module.title}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === 'warehouse_manager' || user?.role === 'super_admin' ? (
              <>
                <Link href="/warehouse/receipts">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Record Receipts
                  </Button>
                </Link>
                
                <Link href="/warehouse/direct-shipments">
                  <Button variant="outline" className="w-full justify-start">
                    <Ship className="w-4 h-4 mr-2" />
                    Direct Shipments
                  </Button>
                </Link>

                <Link href="/warehouse/local-councils/shipments">
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="w-4 h-4 mr-2" />
                    Council Shipments
                  </Button>
                </Link>
              </>
            ) : null}

            {(user?.role === 'warehouse_manager' || user?.role === 'super_admin' || user?.role === 'view_only') && (
              <Link href="/warehouse/local-councils/reports">
                <Button variant="outline" className={`w-full ${isMobile ? 'h-12 justify-center' : 'justify-start'}`}>
                  <FileBarChart className="w-4 h-4 mr-2" />
                  {isMobile ? "Reports" : "Warehouse Reports"}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role-based Access Notice */}
      {user?.role === 'warehouse_manager' && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Warehouse className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">Warehouse Manager Access</h3>
                <p className="text-sm text-orange-700">
                  As a Warehouse Manager, you have access to record material receipts, create shipments 
                  to local councils and schools, and monitor the entire distribution process. You manage 
                  the national inventory and coordinate all outgoing shipments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'super_admin' && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Administrator Access</h3>
                <p className="text-sm text-amber-700">
                  As a Super Administrator, you have full access to all warehouse operations. 
                  You can manage inventory receipts, create and monitor shipments, and access 
                  comprehensive reports across the entire supply chain system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'view_only' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <FileBarChart className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">View-Only Access</h3>
                <p className="text-sm text-blue-700">
                  As a View-Only user, you can access warehouse reports and monitor distribution 
                  activities. You have read-only access to track the flow of educational materials 
                  through the system without making changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}