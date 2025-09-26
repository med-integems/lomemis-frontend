"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  School, 
  Search, 
  Building2, 
  Users, 
  Package, 
  CheckCircle,
  Clock,
  Plus,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface School {
  id: number;
  name: string;
  code: string;
  councilName: string;
  councilId: number;
  enrollmentCount: number;
  lastDistributionDate?: string;
  pendingDistributions?: number;
  totalDistributions?: number;
  needsAttention?: boolean;
}

interface Council {
  id: number;
  name: string;
  schoolCount: number;
  pendingDistributions: number;
  totalDistributions: number;
  district?: string;
}

export function SchoolsInCouncils() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCouncil, setSelectedCouncil] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("schools");

  // Mock data - this would come from API
  const mockCouncils: Council[] = [
    { id: 1, name: "Western Area Urban", schoolCount: 89, pendingDistributions: 5, totalDistributions: 34 },
    { id: 2, name: "Western Area Rural", schoolCount: 67, pendingDistributions: 3, totalDistributions: 28 },
    { id: 3, name: "Bo District", schoolCount: 134, pendingDistributions: 8, totalDistributions: 52 },
    { id: 4, name: "Kenema District", schoolCount: 98, pendingDistributions: 4, totalDistributions: 41 },
    { id: 5, name: "Bombali District", schoolCount: 112, pendingDistributions: 6, totalDistributions: 38 },
  ];

  const mockSchools: School[] = [
    {
      id: 1,
      name: "St. Mary's Primary School",
      code: "SCH-001",
      councilName: "Western Area Urban",
      councilId: 1,
      enrollmentCount: 450,
      lastDistributionDate: "2025-07-15",
      pendingDistributions: 1,
      totalDistributions: 8
    },
    {
      id: 2,
      name: "Government Model School",
      code: "SCH-023",
      councilName: "Western Area Urban",
      councilId: 1,
      enrollmentCount: 680,
      lastDistributionDate: "2025-07-10",
      pendingDistributions: 2,
      totalDistributions: 12,
      needsAttention: true
    },
    {
      id: 3,
      name: "Holy Family Primary School",
      code: "SCH-123",
      councilName: "Bo District", 
      councilId: 3,
      enrollmentCount: 320,
      lastDistributionDate: "2025-06-30",
      pendingDistributions: 0,
      totalDistributions: 5
    },
    {
      id: 4,
      name: "Methodist Primary School",
      code: "SCH-078",
      councilName: "Kenema District",
      councilId: 4,
      enrollmentCount: 520,
      pendingDistributions: 1,
      totalDistributions: 9
    },
    {
      id: 5,
      name: "Community School Bo",
      code: "SCH-089",
      councilName: "Bo District",
      councilId: 3,
      enrollmentCount: 280,
      lastDistributionDate: "2025-07-20",
      pendingDistributions: 0,
      totalDistributions: 6
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSchools(mockSchools);
      setCouncils(mockCouncils);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCouncil = selectedCouncil === "all" || school.councilId.toString() === selectedCouncil;
    
    // Filter by user's council if they are LC officer
    if (user?.role === "lc_officer" && user?.localCouncilId) {
      return matchesSearch && school.councilId === user.localCouncilId;
    }

    // Filter by user's district if they are District Education Officer
    if (user?.role === "district_officer" && user?.district) {
      const council = councils.find((c) => c.id === school.councilId);
      return (
        matchesSearch &&
        council?.district?.toLowerCase() === user.district.toLowerCase()
      );
    }
    
    return matchesSearch && matchesCouncil;
  });

  const getStatusBadge = (school: School) => {
    if (school.needsAttention) {
      return <Badge variant="destructive">Needs Attention</Badge>;
    }
    if (school.pendingDistributions && school.pendingDistributions > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        {school.pendingDistributions} Pending
      </Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Up to Date</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schools - Council Distributions</h1>
            <p className="text-muted-foreground">Loading schools...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schools - Council Distributions</h1>
          <p className="text-muted-foreground">
            Manage schools and distributions within local councils
          </p>
        </div>
        <Link href="/distributions/create">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Distribution
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="councils">By Council</TabsTrigger>
        </TabsList>

        <TabsContent value="schools" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search schools by name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {user?.role !== "lc_officer" && (
                  <div className="w-full md:w-64">
                    <select
                      value={selectedCouncil}
                      onChange={(e) => setSelectedCouncil(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="all">All Councils</option>
                      {councils.map(council => (
                        <option key={council.id} value={council.id.toString()}>{council.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.map((school) => (
              <Card key={school.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <School className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{school.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{school.code}</p>
                      </div>
                    </div>
                    {getStatusBadge(school)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{school.councilName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{school.enrollmentCount.toLocaleString()} students</span>
                    </div>
                    {school.lastDistributionDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Last distribution: {new Date(school.lastDistributionDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      {school.totalDistributions || 0} total distributions
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/distributions/create?schoolId=${school.id}`}>
                        <Button size="sm" variant="outline">
                          Distribute
                        </Button>
                      </Link>
                      <Link href={`/distributions?schoolId=${school.id}`}>
                        <Button size="sm" variant="ghost">
                          History
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSchools.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No schools found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setSelectedCouncil("all");
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="councils" className="space-y-4">
          {/* Councils Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {councils.map((council) => (
              <Card key={council.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{council.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{council.schoolCount} schools</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-yellow-900">{council.pendingDistributions}</p>
                      <p className="text-xs text-yellow-600">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-900">{council.totalDistributions}</p>
                      <p className="text-xs text-green-600">Total</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Link href={`/distributions?councilId=${council.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        View Distributions
                      </Button>
                    </Link>
                    <Link href={`/inventory/councils?councilId=${council.id}`}>
                      <Button size="sm" variant="ghost">
                        Inventory
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
