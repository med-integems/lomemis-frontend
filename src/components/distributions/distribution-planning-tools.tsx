"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  Target,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Calendar,
  MapPin,
  FileText,
  Download
} from "lucide-react";
import { councilInventoryApi, schoolsApi, distributionsApi } from "@/lib/api";
import { School, CouncilInventoryItem } from "@/types";
import { toast } from "sonner";

interface DistributionPlan {
  schoolId: number;
  schoolName: string;
  schoolType: string;
  studentCount: number;
  items: {
    itemId: number;
    itemName: string;
    recommendedQuantity: number;
    availableQuantity: number;
    plannedQuantity: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  totalPriority: number;
}

interface PlanningCriteria {
  distributionType: 'enrollment_based' | 'equal_distribution' | 'needs_based';
  itemsPerStudent: number;
  prioritizeByType: boolean;
  prioritizeBySize: boolean;
  reserveBuffer: number; // Percentage to keep as buffer
}

interface DistributionPlanningToolsProps {
  councilId?: number | null;
}

export function DistributionPlanningTools({ councilId }: DistributionPlanningToolsProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [inventory, setInventory] = useState<CouncilInventoryItem[]>([]);
  const [distributionPlans, setDistributionPlans] = useState<DistributionPlan[]>([]);
  const [criteria, setCriteria] = useState<PlanningCriteria>({
    distributionType: 'enrollment_based',
    itemsPerStudent: 1,
    prioritizeByType: true,
    prioritizeBySize: true,
    reserveBuffer: 10,
  });
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, [councilId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schoolsResponse, inventoryResponse] = await Promise.all([
        councilId ? schoolsApi.getSchoolsByCouncil(councilId, 1, 200) : schoolsApi.getSchools(1, 100),
        councilInventoryApi.getCouncilInventory(1, 500, councilId ? { councilId } : {})
      ]);

      const schoolsData = Array.isArray(schoolsResponse.data?.schools) 
        ? schoolsResponse.data.schools 
        : Array.isArray(schoolsResponse.data) 
        ? schoolsResponse.data 
        : [];

      const inventoryData = Array.isArray(inventoryResponse.data?.inventory) 
        ? inventoryResponse.data.inventory 
        : Array.isArray(inventoryResponse.data) 
        ? inventoryResponse.data 
        : [];

      setSchools(schoolsData);
      setInventory(inventoryData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data for planning");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistributionPlan = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to distribute");
      return;
    }

    const plans: DistributionPlan[] = schools.map(school => {
      const schoolPriority = getSchoolPriority(school);
      
      const items = selectedItems.map(itemId => {
        const inventoryItem = inventory.find(inv => inv.itemId === itemId);
        if (!inventoryItem) return null;

        const recommendedQuantity = calculateRecommendedQuantity(school, inventoryItem);
        const availableQuantity = inventoryItem.availableQuantity;
        const plannedQuantity = Math.min(recommendedQuantity, availableQuantity);

        return {
          itemId,
          itemName: inventoryItem.itemName,
          recommendedQuantity,
          availableQuantity,
          plannedQuantity,
          priority: getItemPriority(inventoryItem, school),
        };
      }).filter(Boolean) as any[];

      return {
        schoolId: school.id,
        schoolName: school.name,
        schoolType: school.type || 'primary',
        studentCount: school.studentCount || 0,
        items,
        totalPriority: schoolPriority,
      };
    });

    // Sort schools by priority
    plans.sort((a, b) => b.totalPriority - a.totalPriority);
    
    // Adjust quantities based on available inventory
    adjustQuantitiesForAvailability(plans);
    
    setDistributionPlans(plans);
    toast.success("Distribution plan calculated successfully");
  };

  const getSchoolPriority = (school: School): number => {
    let priority = 0;
    
    // Base priority on student count
    const studentCount = school.studentCount || 0;
    priority += studentCount * 0.1;
    
    // Priority adjustments based on criteria
    if (criteria.prioritizeByType) {
      switch (school.type) {
        case 'primary':
          priority += 50;
          break;
        case 'secondary':
          priority += 30;
          break;
        case 'pre_primary':
          priority += 20;
          break;
      }
    }
    
    if (criteria.prioritizeBySize) {
      if (studentCount > 500) priority += 30;
      else if (studentCount > 200) priority += 20;
      else if (studentCount > 100) priority += 10;
    }
    
    return priority;
  };

  const calculateRecommendedQuantity = (school: School, item: CouncilInventoryItem): number => {
    const studentCount = school.studentCount || 0;
    
    switch (criteria.distributionType) {
      case 'enrollment_based':
        return Math.ceil(studentCount * criteria.itemsPerStudent);
      case 'equal_distribution':
        const totalSchools = schools.length;
        const totalAvailable = item.availableQuantity;
        const bufferAmount = totalAvailable * (criteria.reserveBuffer / 100);
        return Math.floor((totalAvailable - bufferAmount) / totalSchools);
      case 'needs_based':
        // More complex logic based on school type and size
        let baseQuantity = studentCount * criteria.itemsPerStudent;
        if (school.type === 'primary') baseQuantity *= 1.2;
        if (studentCount < 100) baseQuantity *= 1.1; // Extra support for small schools
        return Math.ceil(baseQuantity);
      default:
        return studentCount * criteria.itemsPerStudent;
    }
  };

  const getItemPriority = (item: CouncilInventoryItem, school: School): 'high' | 'medium' | 'low' => {
    // Simple priority logic based on item category and school type
    if (item.category === 'Textbooks') return 'high';
    if (item.category === 'Stationery' && school.type === 'primary') return 'high';
    if (item.category === 'Science Equipment' && school.type === 'secondary') return 'high';
    return 'medium';
  };

  const adjustQuantitiesForAvailability = (plans: DistributionPlan[]) => {
    // Adjust planned quantities when total demand exceeds supply
    selectedItems.forEach(itemId => {
      const inventoryItem = inventory.find(inv => inv.itemId === itemId);
      if (!inventoryItem) return;

      const totalDemand = plans.reduce((sum, plan) => {
        const item = plan.items.find(i => i.itemId === itemId);
        return sum + (item?.plannedQuantity || 0);
      }, 0);

      const availableQuantity = inventoryItem.availableQuantity;
      const bufferAmount = availableQuantity * (criteria.reserveBuffer / 100);
      const distributableQuantity = availableQuantity - bufferAmount;

      if (totalDemand > distributableQuantity) {
        // Proportionally reduce quantities
        const scaleFactor = distributableQuantity / totalDemand;
        
        plans.forEach(plan => {
          const item = plan.items.find(i => i.itemId === itemId);
          if (item) {
            item.plannedQuantity = Math.floor(item.plannedQuantity * scaleFactor);
          }
        });
      }
    });
  };

  const generateBulkDistribution = async () => {
    try {
      setLoading(true);
      const distributions = [];

      for (const plan of distributionPlans) {
        if (plan.items.some(item => item.plannedQuantity > 0)) {
          const distributionData = {
            schoolId: plan.schoolId,
            distributionDate: new Date().toISOString().split('T')[0],
            notes: `Bulk distribution generated via planning tool`,
            items: plan.items
              .filter(item => item.plannedQuantity > 0)
              .map(item => ({
                itemId: item.itemId,
                quantityDistributed: item.plannedQuantity,
                notes: `Priority: ${item.priority}`,
              })),
          };

          distributions.push(distributionData);
        }
      }

      // Here you would typically batch create the distributions
      toast.success(`Generated ${distributions.length} distribution plans. Review and create individually.`);
    } catch (error) {
      console.error("Error generating distributions:", error);
      toast.error("Failed to generate bulk distributions");
    } finally {
      setLoading(false);
    }
  };

  const exportPlan = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distribution-plan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (): string => {
    let csv = 'School Name,School Type,Student Count,Item Name,Recommended Quantity,Available Quantity,Planned Quantity,Priority\n';
    
    distributionPlans.forEach(plan => {
      plan.items.forEach(item => {
        csv += `"${plan.schoolName}","${plan.schoolType}",${plan.studentCount},"${item.itemName}",${item.recommendedQuantity},${item.availableQuantity},${item.plannedQuantity},"${item.priority}"\n`;
      });
    });
    
    return csv;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Distribution Planning Tools</h2>
          <p className="text-muted-foreground">
            Plan and optimize distributions across schools in your council
          </p>
        </div>
        {distributionPlans.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={exportPlan} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Plan
            </Button>
            <Button onClick={generateBulkDistribution} disabled={loading}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Distributions
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="criteria" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="criteria">Planning Criteria</TabsTrigger>
          <TabsTrigger value="items">Select Items</TabsTrigger>
          <TabsTrigger value="plan">Distribution Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Distribution Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Distribution Type</label>
                  <select
                    value={criteria.distributionType}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      distributionType: e.target.value as any
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="enrollment_based">Based on Enrollment</option>
                    <option value="equal_distribution">Equal Distribution</option>
                    <option value="needs_based">Needs-Based</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Items per Student</label>
                  <Input
                    type="number"
                    value={criteria.itemsPerStudent}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      itemsPerStudent: parseFloat(e.target.value) || 0
                    })}
                    min="0.1"
                    step="0.1"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Reserve Buffer (%)</label>
                  <Input
                    type="number"
                    value={criteria.reserveBuffer}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      reserveBuffer: parseFloat(e.target.value) || 0
                    })}
                    min="0"
                    max="50"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={criteria.prioritizeByType}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      prioritizeByType: e.target.checked
                    })}
                  />
                  <span className="text-sm">Prioritize by school type</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={criteria.prioritizeBySize}
                    onChange={(e) => setCriteria({
                      ...criteria,
                      prioritizeBySize: e.target.checked
                    })}
                  />
                  <span className="text-sm">Prioritize by school size</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Items to Distribute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {inventory.map(item => (
                  <label key={item.itemId} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.itemId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.itemId]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.itemId));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category} • Available: {item.availableQuantity}
                      </div>
                    </div>
                    <Badge variant={item.availableQuantity > 100 ? "default" : "secondary"}>
                      {item.availableQuantity} available
                    </Badge>
                  </label>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} items selected
                </span>
                <Button onClick={calculateDistributionPlan} disabled={loading || selectedItems.length === 0}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          {distributionPlans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No distribution plan calculated yet.</p>
                <p className="text-sm">Select items and criteria, then calculate a plan.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Plan Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Plan Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Schools</div>
                      <div className="text-2xl font-bold">{distributionPlans.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Items</div>
                      <div className="text-2xl font-bold">{selectedItems.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Students</div>
                      <div className="text-2xl font-bold">
                        {distributionPlans.reduce((sum, plan) => sum + plan.studentCount, 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Items</div>
                      <div className="text-2xl font-bold">
                        {distributionPlans.reduce((sum, plan) => 
                          sum + plan.items.reduce((itemSum, item) => itemSum + item.plannedQuantity, 0), 0
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribution Plan Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>School</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total Quantity</TableHead>
                          <TableHead>Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {distributionPlans.map(plan => (
                          <TableRow key={plan.schoolId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{plan.schoolName}</div>
                                <div className="text-sm text-muted-foreground">ID: {plan.schoolId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {plan.schoolType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {plan.studentCount.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>{plan.items.length}</TableCell>
                            <TableCell>
                              {plan.items.reduce((sum, item) => sum + item.plannedQuantity, 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                {Math.round(plan.totalPriority)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
