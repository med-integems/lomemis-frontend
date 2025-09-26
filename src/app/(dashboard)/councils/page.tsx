"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  School, 
  Building2,
  Users,
  ArrowRight,
  MapPin,
  GraduationCap,
  FileText,
  CheckCircle,
  Package,
  Truck
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import { useCouncilStats } from "@/hooks/useStatistics";
import { useState, useEffect } from "react";
import { councilsApi } from "@/lib/api";

export default function CouncilsPage() {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  
  // Council filtering for super admin
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | undefined>();
  const [councils, setCouncils] = useState<any[]>([]);
  const [loadingCouncils, setLoadingCouncils] = useState(false);
  
  const { stats: councilStats } = useCouncilStats(selectedCouncilId);

  // Fetch councils list for super admin
  useEffect(() => {
    const fetchCouncils = async () => {
      if (user?.role !== 'super_admin') return;
      
      try {
        setLoadingCouncils(true);
        const response = await councilsApi.getLocalCouncils();
        if (response.success) {
          setCouncils(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching councils:', error);
      } finally {
        setLoadingCouncils(false);
      }
    };

    fetchCouncils();
  }, [user]);

  const councilModules = [
    {
      title: "Council Receipts",
      description: "Confirm receipt of shipments from national warehouses",
      href: "/councils/receipts",
      icon: CheckCircle,
      color: "bg-blue-500",
      roles: ["lc_officer", "district_officer", "super_admin"],
    },
    {
      title: "Council Inventory", 
      description: "View and manage council inventory levels",
      href: "/councils/inventory",
      icon: Package,
      color: "bg-green-500",
      roles: ["lc_officer", "district_officer", "super_admin"],
    },
    {
      title: "Distributions to Schools",
      description: "Create and manage distributions to schools in your jurisdiction",
      href: "/councils/distributions", 
      icon: Truck,
      color: "bg-purple-500",
      roles: ["lc_officer", "district_officer", "super_admin"],
    },
    {
      title: "Council Reports",
      description: "Generate and view comprehensive reports for council operations",
      href: "/councils/reports", 
      icon: FileText,
      color: "bg-indigo-500",
      roles: ["lc_officer", "district_officer", "super_admin", "view_only"],
    },
  ];

  // Filter modules based on user role
  const availableModules = councilModules.filter(module =>
    module.roles.includes(user?.role || '') || user?.role === 'super_admin'
  );

  const quickStats = [
    { label: "Total Schools", value: councilStats[0]?.value || "--", icon: School },
    { label: "Active Students", value: councilStats[1]?.value || "--", icon: Users },
    { label: "Local Councils", value: councilStats[2]?.value || "--", icon: Building2 },
    { label: "Distributions", value: councilStats[3]?.value || "--", icon: GraduationCap },
  ];

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
        <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
          <div className={`flex items-center justify-center bg-green-100 rounded-lg ${
            isMobile ? 'w-10 h-10' : 'w-12 h-12'
          }`}>
            <Building2 className={`text-green-600 ${
              isMobile ? 'w-5 h-5' : 'w-6 h-6'
            }`} />
          </div>
          <div>
            <h1 className={`font-bold text-foreground ${
              isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
            }`}>Local Councils</h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              {isMobile 
                ? "Manage schools and resources within councils" 
                : "Manage schools and educational resources within local council jurisdictions"
              }
            </p>
          </div>
        </div>

        {/* Council Filter for Super Admin */}
        {user?.role === 'super_admin' && (
          <div className={`flex items-center space-x-2 ${isMobile ? 'w-full' : ''}`}>
            <label className="text-sm font-medium text-muted-foreground">
              Filter by Council:
            </label>
            <Select
              value={selectedCouncilId?.toString() || "all"}
              onValueChange={(value) => setSelectedCouncilId(value === "all" ? undefined : parseInt(value))}
            >
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-64'}`}>
                <SelectValue placeholder="Select a council" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Councils</SelectItem>
                {loadingCouncils ? (
                  <SelectItem value="loading" disabled>Loading councils...</SelectItem>
                ) : (
                  councils.map((council) => (
                    <SelectItem key={council.id} value={council.id.toString()}>
                      {council.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
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

      {/* Council Modules */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Council Management</h2>
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
            {user?.role === 'lc_officer' || user?.role === 'district_officer' || user?.role === 'super_admin' ? (
              <>
                <Link href="/councils/receipts">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Receipts
                  </Button>
                </Link>
                
                <Link href="/councils/inventory">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    Council Inventory
                  </Button>
                </Link>

                <Link href="/councils/distributions">
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="w-4 h-4 mr-2" />
                    Distributions
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Role-based Access Notice */}
      {(user?.role === 'lc_officer' || user?.role === 'district_officer') && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">
                  {user.role === 'district_officer'
                    ? 'District-Level Access'
                    : 'Local Council Access'}
                </h3>
                <p className="text-sm text-blue-700">
                  {user.role === 'district_officer'
                    ? 'As a District Education Officer, you can manage schools and distributions across all councils within your assigned district. Your access is scoped to the district you oversee.'
                    : "As a Local Council M&E Officer, you have access to manage schools and distributions within your assigned local council jurisdiction. Your access is restricted to your council's schools and related activities."}
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
                  As a Super Administrator, you have full access to all local councils and their schools. 
                  You can view and manage educational resources across all jurisdictions in the system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
