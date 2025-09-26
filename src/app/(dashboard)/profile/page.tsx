"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResponsive } from "@/hooks/useResponsive";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Settings, Shield, Key } from "lucide-react";
import { ProfileForm } from "@/components/auth/profile-form";
import { PasswordChangeForm } from "@/components/auth/password-change-form";
import { SessionManagement } from "@/components/auth/session-management";
import { useAuth } from "@/contexts/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      <div>
        <h1 className={`${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>
          Profile Settings
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
          {isMobile ? "Manage your account" : "Manage your account settings and preferences"}
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your current account details and role information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                Name
              </label>
              <p className={`${isMobile ? 'text-base' : 'text-lg'}`}>{user.name}</p>
            </div>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                Email
              </label>
              <p className={`${isMobile ? 'text-base' : 'text-lg'} break-all`}>{user.email}</p>
            </div>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                Role
              </label>
              <p className={`${isMobile ? 'text-base' : 'text-lg'} capitalize`}>
                {user.role.replace("_", " ")}
              </p>
            </div>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                Status
              </label>
              <p className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-auto' : ''}`}>
          <TabsTrigger value="profile" className={`flex items-center gap-2 ${isMobile ? 'flex-col py-3 text-xs' : ''}`}>
            <Settings className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
            {isMobile ? "Profile" : "Profile"}
          </TabsTrigger>
          <TabsTrigger value="password" className={`flex items-center gap-2 ${isMobile ? 'flex-col py-3 text-xs' : ''}`}>
            <Key className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
            {isMobile ? "Password" : "Password"}
          </TabsTrigger>
          <TabsTrigger value="sessions" className={`flex items-center gap-2 ${isMobile ? 'flex-col py-3 text-xs' : ''}`}>
            <Shield className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
            {isMobile ? "Sessions" : "Sessions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <PasswordChangeForm />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
