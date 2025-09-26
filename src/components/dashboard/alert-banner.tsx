"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Using custom collapsible implementation since component doesn't exist
import { AlertTriangle, AlertCircle, Info, X, ChevronDown, ChevronUp, Zap, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAlertActions } from "@/hooks/useSmartActions";

interface SmartAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "danger";
  href?: string;
  params?: Record<string, any>;
  loading?: boolean;
}

interface AlertRecommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  actions: SmartAction[];
}

interface DashboardAlert {
  type: "critical" | "high" | "medium" | "low" | "warning" | "error" | "info";
  priority: number; // 1-5, 1 being highest priority
  label: string;
  count: number;
  link: string;
  description?: string;
  recommendations?: AlertRecommendation[];
  autoActions?: SmartAction[];
  context?: {
    trend?: "up" | "down" | "stable";
    severity?: "increasing" | "stable" | "decreasing";
    timeframe?: string;
  };
}

interface AlertBannerProps {
  alerts: DashboardAlert[];
  dismissible?: boolean;
}

export function AlertBanner({ alerts, dismissible = false }: AlertBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const { handleSmartAction, isActionLoading } = useAlertActions();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="h-4 w-4 animate-pulse" />;
      case "high":
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "low":
      case "info":
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <Badge variant="destructive" className="text-xs bg-red-600">Critical</Badge>;
      case 2:
        return <Badge variant="destructive" className="text-xs bg-orange-600">High</Badge>;
      case 3:
        return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">Medium</Badge>;
      case 4:
        return <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">Low</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Info</Badge>;
    }
  };

  const getAlertStyles = (type: string, priority: number) => {
    const baseStyles = "transition-all duration-200 hover:shadow-md";
    switch (type) {
      case "critical":
        return `${baseStyles} border-red-600 bg-red-50 text-red-900 shadow-red-100`;
      case "high":
      case "error":
        return `${baseStyles} border-red-500 bg-red-50 text-red-800`;
      case "medium":
      case "warning":
        return `${baseStyles} border-yellow-500 bg-yellow-50 text-yellow-800`;
      case "low":
      case "info":
      default:
        return `${baseStyles} border-blue-500 bg-blue-50 text-blue-800`;
    }
  };

  const dismissAlert = (alertKey: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertKey]));
  };

  const toggleAlert = (alertKey: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertKey)) {
        newSet.delete(alertKey);
      } else {
        newSet.add(alertKey);
      }
      return newSet;
    });
  };

  const executeSmartAction = async (action: SmartAction, alertKey: string) => {
    await handleSmartAction(action.id, action.params, action.href);
  };

  // Sort alerts by priority (1 = highest)
  const sortedAlerts = alerts.slice().sort((a, b) => a.priority - b.priority);
  
  const visibleAlerts = sortedAlerts.filter(alert => {
    const alertKey = `${alert.type}-${alert.label}-${alert.priority}`;
    return !dismissedAlerts.has(alertKey);
  });

  if (visibleAlerts.length === 0) {
    return null;
  }

  const renderSmartActions = (actions: SmartAction[], alertKey: string) => {
    return actions.map((action) => {
      const isLoading = isActionLoading(action.id, action.params);
      
      const buttonProps = {
        size: "sm" as const,
        disabled: isLoading,
        className: `min-w-[80px] ${isLoading ? 'opacity-50' : ''}`,
      };

      const buttonVariant = action.type === "primary" ? "default" : 
                           action.type === "danger" ? "destructive" : "outline";

      if (action.href) {
        return (
          <Button key={action.id} asChild variant={buttonVariant} {...buttonProps}>
            <Link href={action.href} className="inline-flex items-center gap-1">
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
              {action.label}
            </Link>
          </Button>
        );
      }

      return (
        <Button
          key={action.id}
          variant={buttonVariant}
          {...buttonProps}
          onClick={() => executeSmartAction(action, alertKey)}
        >
          {isLoading ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent mr-1" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 mr-1" />
              {action.label}
            </>
          )}
        </Button>
      );
    });
  };

  const renderRecommendations = (recommendations: AlertRecommendation[], alertKey: string) => {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <CheckCircle className="h-4 w-4" />
          Recommended Actions
        </div>
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-white/50 rounded-lg p-3 border border-white/20">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{rec.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <Badge variant="outline" className="text-xs">
                  {rec.impact} impact
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {rec.effort} effort
                </Badge>
              </div>
            </div>
            {rec.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {renderSmartActions(rec.actions, `${alertKey}-${rec.id}`)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3 mb-6">
      {visibleAlerts.map((alert, index) => {
        const alertKey = `${alert.type}-${alert.label}-${alert.priority}`;
        const isExpanded = expandedAlerts.has(alertKey);
        const hasExpandableContent = alert.recommendations || alert.description || (alert.autoActions && alert.autoActions.length > 0);

        return (
          <Alert key={index} className={`${getAlertStyles(alert.type, alert.priority)} relative`}>
            <div className="flex items-start justify-between w-full">
              <div className="flex items-start gap-3 flex-1">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertDescription className="font-medium text-base">
                          {alert.label}
                        </AlertDescription>
                        {getPriorityBadge(alert.priority)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/50 font-semibold">
                          {alert.count} {alert.count === 1 ? 'item' : 'items'}
                        </Badge>
                        {alert.context?.trend && (
                          <Badge variant="outline" className="text-xs font-medium">
                            Trend: {alert.context.trend}
                          </Badge>
                        )}
                        {alert.context?.timeframe && (
                          <span className="text-xs text-gray-600 font-medium">
                            {alert.context.timeframe}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {/* Quick Actions */}
                {alert.autoActions && alert.autoActions.length > 0 && (
                  <div className="hidden sm:flex gap-1">
                    {renderSmartActions(alert.autoActions.slice(0, 2), alertKey)}
                  </div>
                )}
                
                <Button asChild variant="outline" size="sm">
                  <Link href={alert.link}>
                    View Details
                  </Link>
                </Button>
                
                {hasExpandableContent && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto"
                    onClick={() => toggleAlert(alertKey)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                {dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alertKey)}
                    className="p-1 h-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && hasExpandableContent && (
              <div className="mt-3 transition-all duration-200 ease-in-out">
                {alert.description && (
                  <div className="mb-3 text-sm text-gray-700 bg-white/30 rounded p-2">
                    {alert.description}
                  </div>
                )}
                
                {/* Mobile quick actions */}
                {alert.autoActions && alert.autoActions.length > 0 && (
                  <div className="sm:hidden mb-3">
                    <div className="flex flex-wrap gap-2">
                      {renderSmartActions(alert.autoActions, alertKey)}
                    </div>
                  </div>
                )}
                
                {alert.recommendations && renderRecommendations(alert.recommendations, alertKey)}
              </div>
            )}
          </Alert>
        );
      })}
    </div>
  );
}

// Summary version for sidebar or compact display
export function AlertSummary({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }

  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0);
  const criticalAlerts = alerts.filter(alert => alert.type === "critical" || alert.priority === 1).length;
  const highAlerts = alerts.filter(alert => alert.type === "high" || alert.priority === 2).length;
  const warningAlerts = alerts.filter(alert => alert.type === "warning" || alert.type === "medium").length;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <span className="font-medium">{totalAlerts}</span>
        <span className="text-gray-600">alerts</span>
      </div>
      {criticalAlerts > 0 && (
        <Badge variant="destructive" className="text-xs bg-red-600">
          {criticalAlerts} critical
        </Badge>
      )}
      {highAlerts > 0 && (
        <Badge variant="destructive" className="text-xs bg-orange-600">
          {highAlerts} high
        </Badge>
      )}
      {warningAlerts > 0 && (
        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
          {warningAlerts} warnings
        </Badge>
      )}
    </div>
  );
}

// Skeleton for loading state
export function AlertBannerSkeleton() {
  return (
    <Alert className="mb-6 bg-gray-50 border-gray-300">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-8 w-24 bg-gray-300 rounded animate-pulse"></div>
      </div>
    </Alert>
  );
}