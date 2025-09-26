"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, Building2, AlertTriangle } from "lucide-react";
import { CouncilHierarchy, SchoolStagingRowRecord } from "@/types";
import { useResolveCouncil } from "@/hooks/useAdmin";

interface CouncilMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRows: SchoolStagingRowRecord[];
  councilHierarchy: CouncilHierarchy | undefined;
  importRunId: number;
  onSuccess: () => void;
}

export function CouncilMappingDialog({
  open,
  onOpenChange,
  selectedRows,
  councilHierarchy,
  importRunId,
  onSuccess
}: CouncilMappingDialogProps) {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | null>(null);
  const [createAlias, setCreateAlias] = useState(false);
  const [aliasName, setAliasName] = useState("");

  const resolveCouncilMutation = useResolveCouncil();

  const regions = useMemo(() => {
    if (!councilHierarchy) return [];
    return councilHierarchy.regions.map(region => region.name);
  }, [councilHierarchy]);

  const districts = useMemo(() => {
    if (!councilHierarchy || !selectedRegion) return [];
    const region = councilHierarchy.regions.find(r => r.name === selectedRegion);
    return region?.districts.map(district => district.name) || [];
  }, [councilHierarchy, selectedRegion]);

  const councils = useMemo(() => {
    if (!councilHierarchy || !selectedRegion || !selectedDistrict) return [];
    const region = councilHierarchy.regions.find(r => r.name === selectedRegion);
    const district = region?.districts.find(d => d.name === selectedDistrict);
    return district?.councils || [];
  }, [councilHierarchy, selectedRegion, selectedDistrict]);

  const uniqueSubmittedCouncils = useMemo(() => {
    const councils = new Set<string>();
    selectedRows.forEach(row => {
      if (row.council) {
        councils.add(row.council);
      }
    });
    return Array.from(councils);
  }, [selectedRows]);

  const handleResolve = async () => {
    if (!selectedCouncilId) return;

    try {
      await resolveCouncilMutation.mutateAsync({
        importRunId,
        resolveData: {
          stagingRowIds: selectedRows.map(row => row.id),
          councilId: selectedCouncilId,
          createAlias: createAlias,
          aliasName: createAlias ? aliasName : undefined
        }
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setSelectedRegion("");
    setSelectedDistrict("");
    setSelectedCouncilId(null);
    setCreateAlias(false);
    setAliasName("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map Council
          </DialogTitle>
          <DialogDescription>
            Map {selectedRows.length} row(s) to an existing local council
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Rows Summary */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selected Rows</Label>
            <div className="border rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {selectedRows.slice(0, 5).map((row, index) => (
                  <div key={row.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.schoolName}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{row.council}</span>
                      <Badge variant="outline" className="text-xs">
                        Row {row.fileRowNumber}
                      </Badge>
                    </div>
                  </div>
                ))}
                {selectedRows.length > 5 && (
                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    ... and {selectedRows.length - 5} more rows
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submitted Council Names */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Submitted Council Names</Label>
            <div className="flex flex-wrap gap-2">
              {uniqueSubmittedCouncils.map((council, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {council}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Council Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Select Target Council</Label>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region" className="text-xs">Region</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-xs">District</Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={!selectedRegion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="council" className="text-xs">Council</Label>
                <Select
                  value={selectedCouncilId?.toString() || ""}
                  onValueChange={(value) => setSelectedCouncilId(parseInt(value))}
                  disabled={!selectedDistrict}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select council" />
                  </SelectTrigger>
                  <SelectContent>
                    {councils.map((council) => (
                      <SelectItem key={council.id} value={council.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          <span>{council.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {council.code}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Alias Creation */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createAlias"
                checked={createAlias}
                onCheckedChange={(checked) => setCreateAlias(checked === true)}
              />
              <Label htmlFor="createAlias" className="text-sm font-medium">
                Create alias for future imports
              </Label>
            </div>

            {createAlias && (
              <div className="space-y-2">
                <Label htmlFor="aliasName" className="text-xs">Alias Name</Label>
                <Input
                  id="aliasName"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                  placeholder="Enter alias name (e.g. 'FCC' for 'Freetown City Council')"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This will help automatically match similar names in future imports
                </p>
              </div>
            )}
          </div>

          {/* Warning for many rows */}
          {selectedRows.length > 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                You are mapping {selectedRows.length} rows. This action will affect multiple schools.
                Please verify this is the correct council for all selected schools.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selectedCouncilId || resolveCouncilMutation.isPending}
          >
            {resolveCouncilMutation.isPending ? "Mapping..." : "Map Council"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}