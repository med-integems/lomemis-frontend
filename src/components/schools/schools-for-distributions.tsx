"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import {
  School,
  MapPin,
  Users,
  Package,
  Search,
  Plus,
  FileText,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { schoolsApi, distributionsApi } from "@/lib/api";
import { School as SchoolType, DistributionWithDetails } from "@/types";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

interface SchoolsForDistributionsProps {
  onSelectSchool: (school: SchoolType) => void;
  councilId?: number | null;
  className?: string;
}

interface SchoolWithStats extends SchoolType {
  totalDistributions: number;
  lastDistributionDate: Date | null;
  pendingDistributions: number;
  totalItemsReceived: number;
}

export function SchoolsForDistributions({
  onSelectSchool,
  councilId,
  className,
}: SchoolsForDistributionsProps) {
  const { user } = useUser();
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Fetch schools with distribution statistics
  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use provided councilId or fall back to user's council
      const effectiveCouncilId = councilId || user?.localCouncilId;

      if (!effectiveCouncilId) {
        setError("Unable to load schools: No council selected or assigned to your account");
        setLoading(false);
        return;
      }

      // Fetch schools for the selected/assigned council with pagination
      console.log(`🏫 Fetching schools for council ${effectiveCouncilId} (page ${currentPage})`);
      const schoolsResponse = await schoolsApi.getSchools(currentPage, pageSize, {
        search: searchTerm,
        schoolType: selectedType === "all" ? undefined : selectedType as "PRIMARY" | "SECONDARY" | "COMBINED",
        localCouncilId: effectiveCouncilId, // Filter by selected/assigned council
      });

      if (schoolsResponse.success && schoolsResponse.data) {
        const schoolsData = Array.isArray(schoolsResponse.data.schools) 
          ? schoolsResponse.data.schools 
          : Array.isArray(schoolsResponse.data) 
          ? schoolsResponse.data 
          : [];
        
        setTotalCount(schoolsResponse.data.total || schoolsData.length);

        // Enhance schools with distribution statistics
        const schoolsWithStats = await Promise.all(
          schoolsData.map(async (school: SchoolType) => {
            try {
              // Fetch distribution statistics for each school
              const distributionsResponse = await distributionsApi.getDistributionsBySchool(school.id);
              
              if (distributionsResponse.success && distributionsResponse.data) {
                const distributions = Array.isArray(distributionsResponse.data.distributions) 
                  ? distributionsResponse.data.distributions 
                  : [];

                const totalDistributions = distributions.length;
                const pendingDistributions = distributions.filter(
                  (d: DistributionWithDetails) => d.status === 'pending' || d.status === 'in_progress'
                ).length;
                
                const totalItemsReceived = distributions.reduce(
                  (sum: number, d: DistributionWithDetails) => sum + (d.totalQuantity || 0), 0
                );

                const lastDistribution = distributions.length > 0 ? 
                  new Date(Math.max(...distributions.map((d: DistributionWithDetails) => 
                    new Date(d.distributionDate || d.createdAt).getTime()
                  ))) : null;

                return {
                  ...school,
                  totalDistributions,
                  pendingDistributions,
                  totalItemsReceived,
                  lastDistributionDate: lastDistribution,
                } as SchoolWithStats;
              }
            } catch (error) {
              console.warn(`Failed to fetch stats for school ${school.id}:`, error);
            }

            // Return school with default stats if API call fails
            return {
              ...school,
              totalDistributions: 0,
              pendingDistributions: 0,
              totalItemsReceived: 0,
              lastDistributionDate: null,
            } as SchoolWithStats;
          })
        );

        setSchools(schoolsWithStats);
        console.log(`✅ Loaded ${schoolsWithStats.length} schools for council ${effectiveCouncilId}`);
      } else {
        setError(schoolsResponse.error?.message || "Failed to fetch schools");
      }
    } catch (error: any) {
      console.error("Error fetching schools:", error);

      // Provide more specific error messages
      if (error.response?.status === 500) {
        setError("Server error: Unable to load schools. Please try again or contact support if the issue persists.");
      } else if (error.response?.status === 403) {
        setError("Access denied: You don't have permission to view schools for this council.");
      } else if (error.response?.status === 404) {
        setError("No schools found for the selected council.");
      } else {
        setError("Failed to fetch schools. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [currentPage, searchTerm, selectedType, councilId, user?.localCouncilId]); // Add councilId dependency

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.localCouncilName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSchoolTypeBadge = (type: string) => {
    switch (type) {
      case 'PRIMARY':
        return <Badge variant="default">Primary</Badge>;
      case 'SECONDARY':
        return <Badge variant="secondary">Secondary</Badge>;
      case 'COMBINED':
        return <Badge variant="outline">Combined</Badge>;
      default:
        return <Badge variant="outline">{type || 'Unknown'}</Badge>;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          Select School for Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools by name, address, or council..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PRIMARY">Primary</SelectItem>
              <SelectItem value="SECONDARY">Secondary</SelectItem>
              <SelectItem value="COMBINED">Combined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Schools Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  fetchSchools();
                }}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No schools found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Distributions</TableHead>
                  <TableHead>Last Distribution</TableHead>
                  <TableHead>Items Received</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{school.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {school.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSchoolTypeBadge(school.schoolType || 'PRIMARY')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-1 text-muted-foreground" />
                        <div className="text-sm">
                          <div>{school.address}</div>
                          <div className="text-muted-foreground">{school.localCouncilName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{school.totalDistributions}</div>
                        {school.pendingDistributions > 0 && (
                          <div className="text-sm text-orange-600">
                            {school.pendingDistributions} pending
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(school.lastDistributionDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span className="text-sm">{school.totalItemsReceived.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => onSelectSchool(school)}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && schools.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / pageSize)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}