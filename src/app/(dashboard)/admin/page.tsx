"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  School, 
  MapPin, 
  Warehouse,
  Settings,
  ArrowRight,
  Shield,
  Database,
  Eye
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useSystemStatistics } from "@/hooks/useAdminStatistics";
import { useResponsive } from "@/hooks/useResponsive";

export default function SystemAdministrationPage() {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();
  
  // Fetch system statistics efficiently
  const { data: statisticsResponse, isLoading, error } = useSystemStatistics();

  const adminModules = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions across the system",
      href: "/admin/users",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Item Master",
      description: "Configure and manage the master catalog of teaching and learning materials",
      href: "/admin/items",
      icon: Package,
      color: "bg-green-500",
    },
    {
      title: "School Management",
      description: "Add, edit, and manage schools in the system",
      href: "/admin/schools",
      icon: School,
      color: "bg-purple-500",
    },
    {
      title: "Council Management", 
      description: "Manage local councils and their administrative information",
      href: "/admin/councils",
      icon: MapPin,
      color: "bg-orange-500",
    },
    {
      title: "Warehouse Management",
      description: "Configure and manage national warehouse locations and settings",
      href: "/admin/warehouses",
      icon: Warehouse,
      color: "bg-red-500",
    },
    {
      title: "System Audit Trail",
      description: "Monitor and track all system changes, user activities, and data modifications",
      href: "/admin/audit-trail",
      icon: Eye,
      color: "bg-gray-700",
    },
  ];

  // Extract statistics from API response
  const statistics = (statisticsResponse as any)?.data;
  
  // Calculate display values from statistics
  const totalUsers = statistics?.users?.total || 0;
  const activeUsers = statistics?.users?.active || 0;
  const totalSchools = statistics?.schools?.total || 0;
  const activeSchools = statistics?.schools?.active || 0;
  const totalCouncils = statistics?.councils?.total || 0;
  const activeCouncils = statistics?.councils?.active || 0;
  const totalItems = statistics?.items?.total || 0;
  const activeItems = statistics?.items?.active || 0;

  const overviewStats = [
    { 
      label: "Total Users", 
      value: isLoading ? "..." : error ? "--" : totalUsers.toLocaleString(),
      subtext: isLoading ? "Loading..." : error ? "Error loading" : `${activeUsers} active`,
      icon: Users 
    },
    { 
      label: "Active Schools", 
      value: isLoading ? "..." : error ? "--" : activeSchools.toLocaleString(),
      subtext: isLoading ? "Loading..." : error ? "Error loading" : `of ${totalSchools} total`,
      icon: School 
    },
    { 
      label: "Local Councils", 
      value: isLoading ? "..." : error ? "--" : totalCouncils.toLocaleString(),
      subtext: isLoading ? "Loading..." : error ? "Error loading" : `${activeCouncils} active`,
      icon: MapPin 
    },
    { 
      label: "Master Items", 
      value: isLoading ? "..." : error ? "--" : totalItems.toLocaleString(),
      subtext: isLoading ? "Loading..." : error ? "Error loading" : `${activeItems} active`,
      icon: Package 
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex-shrink-0">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
            System Administration
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage users, master data, and system configuration
          </p>
        </div>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Welcome, {user?.name}!</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                You have super administrator privileges. Use the modules below to manage 
                the LoMEMIS system configuration, user accounts, and master data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {stat.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                    {stat.subtext && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {stat.subtext}
                      </p>
                    )}
                  </div>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Administration Modules */}
      <div>
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <Database className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-xl font-semibold">Administration Modules</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {adminModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 ${module.color} rounded-lg flex-shrink-0`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <CardTitle className="text-base sm:text-lg min-w-0 flex-1 truncate">
                      {module.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {module.description}
                  </p>
                  <Link href={module.href}>
                    <Button 
                      className={`w-full group ${isMobile ? 'h-11' : ''}`}
                      size={isMobile ? "lg" : "default"}
                    >
                      <span className="truncate">
                        {isMobile ? module.title : `Access ${module.title}`}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Security Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-amber-800 text-sm sm:text-base">Security Notice</h3>
              <p className="text-xs sm:text-sm text-amber-700 mt-1">
                System administration functions can affect the entire LoMEMIS system. 
                Please exercise caution when making changes to user accounts, master data, 
                or system configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
