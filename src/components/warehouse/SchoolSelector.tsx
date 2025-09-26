"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, LocalCouncil } from "@/types";
import { schoolsApi, localCouncilsApi } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { LoaderIcon, School as SchoolIcon, MapPin } from "lucide-react";

interface SchoolSelectorProps {
  selectedSchoolId: number;
  onSchoolChange: (schoolId: number, school?: School) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface SchoolWithCouncil extends School {
  councilName?: string;
}

export function SchoolSelector({
  selectedSchoolId,
  onSchoolChange,
  error,
  required = true,
  disabled = false,
}: SchoolSelectorProps) {
  const { user } = useUser();
  const [schools, setSchools] = useState<SchoolWithCouncil[]>([]);
  const [councils, setCouncils] = useState<LocalCouncil[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm] = useState("");

  const fetchSchools = async () => {
    setLoading(true);
    try {
      // Fetch schools and councils from API
      const [schoolsResponse, councilsResponse] = await Promise.all([
        schoolsApi.getSchools(1, 100), // Get first 100 schools
        localCouncilsApi.getLocalCouncils(1, 100) // Get first 100 councils
      ]);

      let schoolsData: SchoolWithCouncil[] = [];
      let councilsData: LocalCouncil[] = [];

      if (schoolsResponse.success && schoolsResponse.data?.schools) {
        schoolsData = schoolsResponse.data.schools;
      }

      if (councilsResponse.success && councilsResponse.data?.councils) {
        councilsData = councilsResponse.data.councils;
      }

      // Enhance schools with council names
      let enhancedSchools = schoolsData.map(school => ({
        ...school,
        councilName: councilsData.find(council => council.id === school.localCouncilId)?.name
      }));

      // Enhanced role checking for consistency with other components
      const isLCOfficer = user?.role === "lc_officer" || user?.roleName === "Local Council M&E Officer" || user?.roleName === "LC M&E Officer";
      const isDEO = user?.role === "district_officer" || user?.roleName === "District Education Officer";

      console.log('🏫 SchoolSelector: User role check', {
        userRole: user?.role,
        userRoleName: user?.roleName,
        isLCOfficer,
        isDEO,
        userDistrict: user?.district,
        totalSchools: enhancedSchools.length,
        totalCouncils: councilsData.length
      });

      // Restrict schools based on role scope
      if (isLCOfficer && (user.councilId || user.localCouncilId)) {
        const effectiveCouncilId = user.councilId || user.localCouncilId;
        console.log('🏫 SchoolSelector: Filtering for LC Officer', { effectiveCouncilId });
        enhancedSchools = enhancedSchools.filter(
          (school) => school.localCouncilId === effectiveCouncilId
        );
        councilsData = councilsData.filter((council) => council.id === effectiveCouncilId);
      } else if (isDEO && user.district) {
        const normalizedDistrict = user.district.trim().toLowerCase();
        console.log('🏫 SchoolSelector: Filtering for DEO', { originalDistrict: user.district, normalizedDistrict });

        const districtCouncilIds = councilsData
          .filter(
            (council) =>
              typeof council.district === "string" &&
              council.district.trim().toLowerCase() === normalizedDistrict
          )
          .map((council) => council.id);

        console.log('🏫 SchoolSelector: Found district councils', {
          districtCouncilIds,
          matchingCouncils: councilsData.filter(c =>
            typeof c.district === "string" &&
            c.district.trim().toLowerCase() === normalizedDistrict
          ).map(c => ({ id: c.id, name: c.name, district: c.district }))
        });

        enhancedSchools = enhancedSchools.filter((school) =>
          districtCouncilIds.includes(school.localCouncilId)
        );
        councilsData = councilsData.filter((council) =>
          districtCouncilIds.includes(council.id)
        );
      }

      console.log('🏫 SchoolSelector: Final filtered results', {
        filteredSchools: enhancedSchools.length,
        filteredCouncils: councilsData.length,
        schoolNames: enhancedSchools.map(s => s.name).slice(0, 5) // Show first 5 school names
      });

      setSchools(enhancedSchools);
      setCouncils(councilsData);
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.roleName, user?.councilId, user?.localCouncilId, user?.district]);

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (school.councilName && school.councilName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSchoolChange = (value: string) => {
    const schoolId = parseInt(value);
    const selectedSchool = schools.find(school => school.id === schoolId);
    onSchoolChange(schoolId, selectedSchool);
  };

  const selectedSchool = schools.find(school => school.id === selectedSchoolId);

  return (
    <div className="space-y-2">
      <Label htmlFor="school-selector" className="text-sm font-medium">
        Destination School {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Select 
        value={selectedSchoolId ? selectedSchoolId.toString() : ""} 
        onValueChange={handleSchoolChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={`w-full ${error ? 'border-red-500' : ''}`}>
          <SelectValue placeholder={loading ? "Loading schools..." : "Select a school"}>
            {selectedSchool && (
              <div className="flex items-center space-x-2">
                <SchoolIcon className="h-4 w-4" />
                <span>{selectedSchool.name}</span>
                {selectedSchool.address && (
                  <span className="text-muted-foreground">
                    ({selectedSchool.address})
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <LoaderIcon className="h-4 w-4 animate-spin" />
              <span className="ml-2">Loading schools...</span>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No schools available
            </div>
          ) : (
            <>
              {/* Group schools by council/region */}
              {councils.map(council => {
                const councilSchools = filteredSchools.filter(school => school.localCouncilId === council.id);
                if (councilSchools.length === 0) return null;
                
                return (
                  <div key={council.id}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{council.name} ({council.region} Region)</span>
                      </div>
                    </div>
                    {councilSchools.map(school => (
                      <SelectItem 
                        key={school.id} 
                        value={school.id.toString()}
                        className="pl-6"
                      >
                        <div className="flex items-center space-x-2">
                          <SchoolIcon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{school.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {school.address}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </SelectContent>
      </Select>

      {/* Selected school details */}
      {selectedSchool && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start space-x-2">
            <SchoolIcon className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-green-800">{selectedSchool.name}</div>
              <div className="text-sm text-green-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{selectedSchool.address}, {selectedSchool.councilName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

export default SchoolSelector;

