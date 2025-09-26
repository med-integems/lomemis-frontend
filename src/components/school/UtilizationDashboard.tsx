'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  BookOpen, 
  AlertTriangle, 
  BarChart3,
  PieChart,
  Activity,
  Clock
} from "lucide-react";
import { schoolUtilizationApi } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { format, subDays, subMonths } from "date-fns";

interface UtilizationStats {
  total_consumed: number;
  total_transactions: number;
  avg_daily_usage: number;
  last_usage_date: string | null;
  top_consuming_items: Array<{
    item_id: number;
    item_name: string;
    total_used: number;
    usage_percentage: number;
  }>;
  usage_by_grade: Array<{
    grade_level: string;
    total_used: number;
    transaction_count: number;
  }>;
  usage_by_subject: Array<{
    subject: string;
    total_used: number;
    transaction_count: number;
  }>;
  wastage_summary: {
    total_wastage: number;
    damage_write_offs: number;
    loss_write_offs: number;
    expiry_write_offs: number;
  };
}

interface ReorderItem {
  id: number;
  item_name: string;
  category: string;
  current_quantity: number;
  reorder_point: number;
  usage_rate: number;
  days_remaining: number;
}

interface UtilizationDashboardProps {
  schoolId: number;
  onRecordUtilization?: () => void;
}

const UtilizationDashboard: React.FC<UtilizationDashboardProps> = ({
  schoolId,
  onRecordUtilization
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UtilizationStats | null>(null);
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [dateRange, setDateRange] = useState<string>('30'); // days
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadUtilizationData();
  }, [schoolId, dateRange]);

  const loadUtilizationData = async () => {
    setLoading(true);
    setError('');

    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      // Load utilization stats
      const statsResponse = await schoolUtilizationApi.getUtilizationStats(
        schoolId,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      
      if (statsResponse.success) {
        setStats(statsResponse.data);
      } else {
        throw new Error(statsResponse.error?.message || 'Failed to load utilization stats');
      }

      // Load items needing reorder
      const reorderResponse = await schoolUtilizationApi.getItemsNeedingReorder(schoolId);
      if (reorderResponse.success) {
        setReorderItems(reorderResponse.data.items_needing_reorder || []);
      }

    } catch (error: any) {
      console.error('Error loading utilization data:', error);
      const errorMessage = error.message || error.response?.data?.error || 'Failed to load utilization data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateReorderPoints = async () => {
    try {
      const response = await schoolUtilizationApi.updateReorderPoints(schoolId);
      if (response.success) {
        toast.success('Reorder points updated based on usage patterns');
        loadUtilizationData(); // Refresh data
      } else {
        throw new Error(response.error?.message || 'Failed to update reorder points');
      }
    } catch (error: any) {
      console.error('Error updating reorder points:', error);
      toast.error(error.message || 'Failed to update reorder points');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No utilization data available</p>
            <p className="text-muted-foreground mb-4">Start recording material usage to see analytics</p>
            {onRecordUtilization && (
              <Button onClick={onRecordUtilization}>
                Record Material Usage
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const utilizationRate = stats.total_consumed > 0 ? 
    ((stats.total_consumed - stats.wastage_summary.total_wastage) / stats.total_consumed * 100) : 0;

  const wastageRate = stats.total_consumed > 0 ? 
    (stats.wastage_summary.total_wastage / stats.total_consumed * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Material Utilization Dashboard</h2>
          <p className="text-muted-foreground">Track how your school uses teaching and learning materials</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {onRecordUtilization && (
            <Button onClick={onRecordUtilization}>
              Record Usage
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items Used</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_consumed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_transactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avg_daily_usage)}</div>
            <p className="text-xs text-muted-foreground">
              items per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {utilizationRate.toFixed(1)}%
            </div>
            <Progress value={utilizationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wastage Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {wastageRate.toFixed(1)}%
            </div>
            <Progress value={wastageRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Reorder Alerts */}
      {reorderItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Items Need Reordering ({reorderItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {reorderItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.current_quantity} remaining • {item.days_remaining} days left
                    </p>
                  </div>
                  <Badge variant={item.days_remaining <= 7 ? "destructive" : "secondary"}>
                    {item.days_remaining <= 7 ? "Urgent" : "Low Stock"}
                  </Badge>
                </div>
              ))}
            </div>
            <Button onClick={updateReorderPoints} variant="outline" size="sm">
              Update Reorder Points
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Consuming Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Consuming Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.top_consuming_items.slice(0, 5).map((item, index) => (
                <div key={item.item_id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.item_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={item.usage_percentage} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground w-12">
                        {item.usage_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium">{item.total_used}</p>
                    <p className="text-xs text-muted-foreground">items</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage by Grade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usage by Grade Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.usage_by_grade.slice(0, 6).map((grade) => (
                <div key={grade.grade_level} className="flex items-center justify-between">
                  <span className="font-medium">{grade.grade_level}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {grade.total_used} items
                    </span>
                    <Badge variant="secondary">
                      {grade.transaction_count} transactions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage by Subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Usage by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.usage_by_subject.slice(0, 6).map((subject) => (
                <div key={subject.subject} className="flex items-center justify-between">
                  <span className="font-medium">{subject.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {subject.total_used} items
                    </span>
                    <Badge variant="secondary">
                      {subject.transaction_count} transactions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wastage Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Wastage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Damage Write-offs</span>
                <span className="font-medium text-red-600">
                  {stats.wastage_summary.damage_write_offs}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Loss Write-offs</span>
                <span className="font-medium text-orange-600">
                  {stats.wastage_summary.loss_write_offs}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Expiry Write-offs</span>
                <span className="font-medium text-yellow-600">
                  {stats.wastage_summary.expiry_write_offs}
                </span>
              </div>
              <hr />
              <div className="flex items-center justify-between font-semibold">
                <span>Total Wastage</span>
                <span className="text-red-600">
                  {stats.wastage_summary.total_wastage}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Usage Info */}
      {stats.last_usage_date && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last material usage recorded on {format(new Date(stats.last_usage_date), 'PPP')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UtilizationDashboard;