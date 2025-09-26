"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ItemManagement } from "./item-management";
import { SchoolManagement } from "./school-management";
import { CouncilManagement } from "./council-management";
import { WarehouseManagement } from "./warehouse-management";
import { useAuth } from "@/contexts/auth-context";

export function MasterDataManagement() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("items");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canManageMasterData = mounted && currentUser?.role === "super_admin";

  if (!mounted) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="px-4 lg:px-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Master Data Management
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-0">
            Manage items, schools, councils, and warehouses
          </p>
        </div>
        <Card className="mx-4 lg:mx-0">
          <CardContent className="p-4 lg:p-6">
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageMasterData) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="px-4 lg:px-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Master Data Management
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-0">
            Manage items, schools, councils, and warehouses
          </p>
        </div>
        <Card className="mx-4 lg:mx-0">
          <CardContent className="p-4 lg:p-6">
            <p className="text-muted-foreground text-sm lg:text-base">
              You don&apos;t have permission to access master data management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="px-4 lg:px-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Master Data Management
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base mt-1 lg:mt-0">
          Manage items, schools, councils, and warehouses
        </p>
      </div>

      <div className="space-y-4">
        {/* Mobile Navigation - Select Dropdown */}
        <div className="md:hidden px-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="min-h-[48px]">
              <SelectValue placeholder="Select data type to manage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="items">Items</SelectItem>
              <SelectItem value="schools">Schools</SelectItem>
              <SelectItem value="councils">Local Councils</SelectItem>
              <SelectItem value="warehouses">Warehouses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Navigation - Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="hidden md:block px-4 lg:px-0">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="items" className="text-xs lg:text-sm">
                Items
              </TabsTrigger>
              <TabsTrigger value="schools" className="text-xs lg:text-sm">
                Schools
              </TabsTrigger>
              <TabsTrigger value="councils" className="text-xs lg:text-sm">
                Local Councils
              </TabsTrigger>
              <TabsTrigger value="warehouses" className="text-xs lg:text-sm">
                Warehouses
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-4 lg:px-0">
            <TabsContent value="items" className="space-y-4 mt-0">
              <ItemManagement />
            </TabsContent>

            <TabsContent value="schools" className="space-y-4 mt-0">
              <SchoolManagement />
            </TabsContent>

            <TabsContent value="councils" className="space-y-4 mt-0">
              <CouncilManagement />
            </TabsContent>

            <TabsContent value="warehouses" className="space-y-4 mt-0">
              <WarehouseManagement />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
