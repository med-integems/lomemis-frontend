"use client";

import { SchoolManagement } from "@/components/admin/school-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Users, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useResponsive } from "@/hooks/useResponsive";

export default function SchoolManagementPage() {
  const { user } = useUser();
  const { isMobile, isTablet } = useResponsive();

  // Role-based access control - LC Officers, District Officers, and Super Admins
  if (
    !user ||
    !['lc_officer', 'district_officer', 'super_admin'].includes(user.role)
  ) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-sm mx-auto px-4">
          <AlertTriangle className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} mx-auto text-amber-500 mb-4`} />
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-foreground mb-2`}>
            Access Restricted
          </h3>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
            This page is only available to Local Council Officers, District Education Officers, and Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className={`flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-purple-100 rounded-lg`}>
          <School className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-purple-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>
            School Management
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
            {user?.role === 'lc_officer'
              ? isMobile
                ? `Manage ${user?.localCouncilName || 'council'} schools`
                : `Manage schools within ${user?.localCouncilName || 'your council'} jurisdiction`
              : user?.role === 'district_officer'
              ? isMobile
                ? `Manage schools in ${user?.district || 'your district'}`
                : `Manage schools across all councils within ${user?.district || 'your district'}`
              : isMobile
              ? 'Manage all schools'
              : 'Manage schools across all jurisdictions'}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`flex items-start ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
            <Users className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600 mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-purple-800 mb-1 ${isMobile ? 'text-sm' : ''}`}>School Management Overview</h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-700`}>
                Manage school information, contact details, and representatives. 
                {user?.role === 'lc_officer'
                  ? ' You can only manage schools within your assigned local council jurisdiction.'
                  : user?.role === 'district_officer'
                  ? ' You can manage schools across all councils that fall within your assigned district.'
                  : ' As a Super Administrator, you have access to all schools in the system.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Management Component */}
      <SchoolManagement />
    </div>
  );
}
