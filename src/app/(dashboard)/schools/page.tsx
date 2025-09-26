"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  School, 
  Building2,
  Users,
  ArrowRight,
  GraduationCap,
  FileText,
  CheckCircle,
  Package,
  Truck
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";
import { useSchoolStats } from "@/hooks/useStatistics";

export default function SchoolsPage() {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  const { stats: schoolStats } = useSchoolStats();

  const schoolModules = [
    {
      title: "School Receipts",
      description: "Confirm receipt of distributions from local councils and direct warehouse shipments",
      href: "/schools/receipts",
      icon: CheckCircle,
      color: "bg-blue-500",
      roles: ["school_rep", "super_admin"],
    },
    {
      title: "School Inventory", 
      description: "View and manage school inventory and educational materials",
      href: "/schools/inventory",
      icon: Package,
      color: "bg-green-500",
      roles: ["school_rep", "lc_officer", "district_officer", "super_admin", "view_only"],
    },
    {
      title: "School Management",
      description: "Manage school information and settings",
      href: "/schools/manage", 
      icon: School,
      color: "bg-purple-500",
      roles: ["lc_officer", "district_officer", "super_admin"],
    },
  ];

  // Filter modules based on user role
  const availableModules = schoolModules.filter(module =>
    module.roles.includes(user?.role || '') || user?.role === 'super_admin'
  );

  const quickStats = [
    { label: "My School", value: schoolStats[0]?.value || user?.schoolName || "--", icon: School },
    { label: "Inventory Items", value: schoolStats[1]?.value || "--", icon: Package },
    { label: "Pending Receipts", value: schoolStats[2]?.value || "--", icon: CheckCircle },
    { label: "Students", value: schoolStats[3]?.value || "--", icon: Users },
  ];

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
        <div className={`flex items-center justify-center bg-purple-100 rounded-lg ${
          isMobile ? 'w-10 h-10' : 'w-12 h-12'
        }`}>
          <School className={`text-purple-600 ${
            isMobile ? 'w-5 h-5' : 'w-6 h-6'
          }`} />
        </div>
        <div>
          <h1 className={`font-bold text-foreground ${
            isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
          }`}>Schools</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {isMobile 
              ? "Manage inventory and confirm material receipts" 
              : "Manage school inventory and confirm receipt of educational materials"
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

      {/* School Modules */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <GraduationCap className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">School Management</h2>
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
            {user?.role === 'school_rep' || user?.role === 'super_admin' ? (
              <>
                <Link href="/schools/receipts">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Receipts
                  </Button>
                </Link>
                
                <Link href="/schools/inventory">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    School Inventory
                  </Button>
                </Link>
              </>
            ) : null}

            {(user?.role === 'lc_officer' || user?.role === 'district_officer' || user?.role === 'super_admin') && (
              <Link href="/schools/manage">
                <Button variant="outline" className={`w-full ${isMobile ? 'h-12 justify-center' : 'justify-start'}`}>
                  <School className="w-4 h-4 mr-2" />
                  {isMobile ? "Manage" : "Manage Schools"}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role-based Access Notice */}
      {user?.role === 'school_rep' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <School className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">School Representative Access</h3>
                <p className="text-sm text-green-700">
                  As a School Representative, you have access to confirm receipt of educational materials 
                  delivered to your school and manage your school&apos;s inventory. Your access is restricted 
                  to your assigned school&apos;s data only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'lc_officer' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Local Council Officer Access</h3>
                <p className="text-sm text-blue-700">
                  As a Local Council M&E Officer, you can view school inventories within your jurisdiction 
                  and manage school information. This helps you track distribution effectiveness and 
                  monitor educational resource allocation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'district_officer' && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-indigo-800">District Education Officer Access</h3>
                <p className="text-sm text-indigo-700">
                  As a District Education Officer, you have visibility across all schools within the councils in your district. Use these tools to coordinate support, monitor inventory levels, and ensure schools receive the materials they need.
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
                  As a Super Administrator, you have full access to all schools across the system. 
                  You can view and manage school inventories, confirm receipts, and manage school information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
