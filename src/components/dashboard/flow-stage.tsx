"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Warehouse, 
  Building2, 
  GraduationCap, 
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpDown,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowStageData {
  id: string;
  name: string;
  type: 'warehouse' | 'council' | 'school';
  status: 'healthy' | 'attention' | 'critical';
  metrics: {
    itemCount: number;
    processingTime: number;
    efficiency: number;
    bottleneckScore: number;
  };
  recentActivity: {
    inbound: number;
    outbound: number;
    pending: number;
  };
  coordinates?: {
    x: number;
    y: number;
  };
}

interface FlowStageProps {
  stage: FlowStageData;
  isSelected?: boolean;
  onClick?: (stageId: string) => void;
  compact?: boolean;
  showAnimation?: boolean;
  className?: string;
}

export function FlowStage({ 
  stage, 
  isSelected = false, 
  onClick, 
  compact = false,
  showAnimation = true,
  className = "" 
}: FlowStageProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(stage.id);
    }
  };

  // Get stage icon
  const getStageIcon = () => {
    const iconClass = compact ? "h-4 w-4" : "h-5 w-5";
    switch (stage.type) {
      case 'warehouse':
        return <Warehouse className={iconClass} />;
      case 'council':
        return <Building2 className={iconClass} />;
      case 'school':
        return <GraduationCap className={iconClass} />;
    }
  };

  // Get status styling with enhanced animations
  const getStatusStyling = () => {
    switch (stage.status) {
      case 'healthy':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          icon: <CheckCircle className="h-3 w-3 text-green-600 animate-pulse" />,
          pulse: 'animate-pulse',
          iconColor: 'text-green-600',
          glow: 'shadow-green-200/50',
          cardPulse: ''
        };
      case 'attention':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          icon: <Clock className="h-3 w-3 text-yellow-600 animate-bounce" />,
          pulse: 'animate-pulse',
          iconColor: 'text-yellow-600',
          glow: 'shadow-yellow-200/50',
          cardPulse: 'animate-pulse'
        };
      case 'critical':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          icon: <AlertTriangle className="h-3 w-3 text-red-600 animate-bounce" />,
          pulse: 'animate-pulse',
          iconColor: 'text-red-600',
          glow: 'shadow-red-200/50',
          cardPulse: 'animate-pulse'
        };
    }
  };

  // Get efficiency trend
  const getEfficiencyTrend = () => {
    if (stage.metrics.efficiency >= 90) {
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    } else if (stage.metrics.efficiency >= 70) {
      return <TrendingDown className="h-3 w-3 text-yellow-600" />;
    } else {
      return <TrendingDown className="h-3 w-3 text-red-600" />;
    }
  };

  // Get bottleneck indicator
  const getBottleneckIndicator = () => {
    if (stage.metrics.bottleneckScore > 0.7) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-2 w-2 mr-1" />
          High
        </Badge>
      );
    } else if (stage.metrics.bottleneckScore > 0.4) {
      return (
        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
          <Clock className="h-2 w-2 mr-1" />
          Medium
        </Badge>
      );
    } else if (stage.metrics.bottleneckScore > 0.1) {
      return (
        <Badge variant="outline" className="text-xs">
          <Activity className="h-2 w-2 mr-1" />
          Low
        </Badge>
      );
    }
    return null;
  };

  const statusStyling = getStatusStyling();

  if (compact) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full h-auto p-3 justify-start",
          statusStyling.border,
          statusStyling.bg,
          isSelected && "ring-2 ring-blue-500 ring-offset-1",
          showAnimation && stage.status !== 'healthy' && statusStyling.cardPulse,
          "hover:shadow-md transition-all duration-200",
          showAnimation && statusStyling.glow && "shadow-lg",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className={statusStyling.iconColor}>
              {getStageIcon()}
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">{stage.name}</div>
              <div className="text-xs text-gray-600 flex items-center gap-1">
                {stage.metrics.itemCount} items • {stage.metrics.efficiency.toFixed(0)}%
                {getEfficiencyTrend()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {statusStyling.icon}
            {getBottleneckIndicator()}
          </div>
        </div>
      </Button>
    );
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        statusStyling.border,
        isSelected && "ring-2 ring-blue-500 ring-offset-1",
        showAnimation && stage.status !== 'healthy' && statusStyling.cardPulse,
        showAnimation && statusStyling.glow && "shadow-lg",
        "hover:scale-105 transform transition-transform duration-200",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={statusStyling.iconColor}>
                {getStageIcon()}
              </div>
              <div>
                <h4 className="font-medium text-sm">{stage.name}</h4>
                <p className="text-xs text-gray-600 capitalize">{stage.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusStyling.icon}
              {getBottleneckIndicator()}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-gray-600">Items</div>
              <div className="font-medium flex items-center gap-1">
                {stage.metrics.itemCount}
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Efficiency</div>
              <div className="font-medium flex items-center gap-1">
                {stage.metrics.efficiency.toFixed(0)}%
                {getEfficiencyTrend()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Processing</div>
              <div className="font-medium flex items-center gap-1">
                <Timer className="h-3 w-3 text-gray-400" />
                {stage.metrics.processingTime.toFixed(1)}d
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Activity</div>
              <div className="font-medium text-xs">
                ↓{stage.recentActivity.inbound} ↑{stage.recentActivity.outbound}
              </div>
            </div>
          </div>

          {/* Activity Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Recent Activity</span>
              <span className={cn(
                "font-medium",
                stage.recentActivity.pending > 5 && "text-yellow-600 animate-pulse",
                stage.recentActivity.pending > 10 && "text-red-600 animate-bounce"
              )}>
                {stage.recentActivity.pending} pending
              </span>
            </div>
            <div className="relative flex h-2 bg-gray-200 rounded-full overflow-hidden">
              {/* Animated background pulse for high activity */}
              {(stage.recentActivity.inbound + stage.recentActivity.outbound) > 20 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-green-200 animate-pulse opacity-50" />
              )}
              
              {/* Inbound */}
              <div 
                className="bg-blue-500 transition-all duration-500 ease-in-out relative overflow-hidden"
                style={{ 
                  width: `${Math.max(
                    (stage.recentActivity.inbound / (stage.recentActivity.inbound + stage.recentActivity.outbound + stage.recentActivity.pending + 1)) * 100,
                    stage.recentActivity.inbound > 0 ? 10 : 0
                  )}%` 
                }}
                title={`Inbound: ${stage.recentActivity.inbound}`}
              >
                {showAnimation && stage.recentActivity.inbound > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-pulse" />
                )}
              </div>
              
              {/* Outbound */}
              <div 
                className="bg-green-500 transition-all duration-500 ease-in-out relative overflow-hidden"
                style={{ 
                  width: `${Math.max(
                    (stage.recentActivity.outbound / (stage.recentActivity.inbound + stage.recentActivity.outbound + stage.recentActivity.pending + 1)) * 100,
                    stage.recentActivity.outbound > 0 ? 10 : 0
                  )}%` 
                }}
                title={`Outbound: ${stage.recentActivity.outbound}`}
              >
                {showAnimation && stage.recentActivity.outbound > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-300 to-transparent animate-pulse" />
                )}
              </div>
              
              {/* Pending */}
              <div 
                className="bg-yellow-500 transition-all duration-500 ease-in-out relative overflow-hidden"
                style={{ 
                  width: `${Math.max(
                    (stage.recentActivity.pending / (stage.recentActivity.inbound + stage.recentActivity.outbound + stage.recentActivity.pending + 1)) * 100,
                    stage.recentActivity.pending > 0 ? 10 : 0
                  )}%` 
                }}
                title={`Pending: ${stage.recentActivity.pending}`}
              >
                {showAnimation && stage.recentActivity.pending > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <Badge 
              variant={stage.status === 'healthy' ? 'secondary' : stage.status === 'attention' ? 'outline' : 'destructive'}
              className="text-xs"
            >
              {stage.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
              {stage.status === 'attention' && <Clock className="h-3 w-3 mr-1" />}
              {stage.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
            </Badge>
            {stage.metrics.bottleneckScore > 0.3 && (
              <div className="text-xs text-gray-600">
                Bottleneck: {(stage.metrics.bottleneckScore * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}