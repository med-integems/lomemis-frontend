"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Minus, Info, ExternalLink } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";

interface TrendDataPoint {
  period: string;
  value: number;
  date?: string;
}

interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendData?: TrendDataPoint[];
  previousValue?: number;
  target?: number;
  link?: string;
  variant?: "default" | "success" | "warning" | "destructive";
  loading?: boolean;
  description?: string;
  insights?: string[];
}

export function KpiCard({
  title,
  value,
  unit,
  trend,
  trendData,
  previousValue,
  target,
  link,
  variant = "default",
  loading = false,
  description,
  insights = [],
}: KpiCardProps) {
  const { deviceType, isTouchDevice } = useResponsive();
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const getTrendIcon = () => {
    if (!trend || trend === 0) return <Minus className={cn("h-3 w-3", deviceType === "mobile" && "h-4 w-4")} />;
    return trend > 0 ? (
      <TrendingUp className={cn("h-3 w-3", deviceType === "mobile" && "h-4 w-4")} />
    ) : (
      <TrendingDown className={cn("h-3 w-3", deviceType === "mobile" && "h-4 w-4")} />
    );
  };

  const getTrendColor = () => {
    if (!trend || trend === 0) return "text-gray-500";
    return trend > 0 ? "text-green-600" : "text-red-600";
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-l-4 border-l-green-500 bg-green-50/50 hover:bg-green-50/70";
      case "warning":
        return "border-l-4 border-l-yellow-500 bg-yellow-50/50 hover:bg-yellow-50/70";
      case "destructive":
        return "border-l-4 border-l-red-500 bg-red-50/50 hover:bg-red-50/70";
      default:
        return "border-l-4 border-l-blue-500 bg-blue-50/50 hover:bg-blue-50/70";
    }
  };

  const getChartColor = () => {
    switch (variant) {
      case "success": return "#10b981";
      case "warning": return "#f59e0b";
      case "destructive": return "#ef4444";
      default: return "#3b82f6";
    }
  };

  const getTargetProgress = () => {
    if (!target || typeof value !== "number") return null;
    const progress = (value / target) * 100;
    return Math.min(progress, 100);
  };

  // Mini chart component
  const MiniChart = () => {
    if (!trendData || trendData.length < 2) return null;
    
    return (
      <div className={cn(
        "mt-2",
        deviceType === "mobile" ? "h-8" : "h-6"
      )}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={getChartColor()}
              strokeWidth={deviceType === "mobile" ? 2 : 1.5}
              dot={false}
              strokeDasharray={variant === "warning" ? "3 3" : "none"}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  return (
                    <div className="bg-white p-2 border rounded shadow-sm text-xs">
                      <p className="font-medium">{payload[0].payload.period}</p>
                      <p className="text-blue-600">
                        {typeof payload[0].value === "number" 
                          ? payload[0].value.toLocaleString() 
                          : payload[0].value}{unit && ` ${unit}`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Progress bar for target comparison
  const TargetProgressBar = () => {
    const progress = getTargetProgress();
    if (!progress) return null;

    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Target: {typeof target === "number" ? target.toLocaleString() : target}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              progress >= 100 ? "bg-green-500" : 
              progress >= 75 ? "bg-blue-500" :
              progress >= 50 ? "bg-yellow-500" : "bg-red-500"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const content = (
    <Card className={cn(
      "transition-all hover:shadow-md cursor-pointer group",
      getVariantStyles(),
      // Touch optimization
      isTouchDevice && "touch-manipulation",
      // Mobile-specific adjustments
      deviceType === "mobile" && "hover:shadow-lg active:scale-[0.98]"
    )}>
      <CardContent className={cn(
        deviceType === "mobile" ? "p-4" : "p-4",
        // Adjust min-height for enhanced content
        "min-h-[140px] flex flex-col"
      )}>
        {loading ? (
          <div className="space-y-3">
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-5" : "h-4"
            )}></div>
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-10" : "h-8"
            )}></div>
            <div className={cn(
              "bg-gray-200 rounded animate-pulse w-16",
              deviceType === "mobile" ? "h-4" : "h-3"
            )}></div>
            <div className={cn(
              "bg-gray-200 rounded animate-pulse w-full",
              deviceType === "mobile" ? "h-6" : "h-4"
            )}></div>
          </div>
        ) : (
          <>
            {/* Header with title and info button */}
            <div className="flex items-center justify-between mb-2">
              <div className={cn(
                "font-medium text-gray-600 flex-1",
                deviceType === "mobile" ? "text-base" : "text-sm"
              )}>
                {title}
              </div>
              {(description || insights.length > 0) && (
                <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                        deviceType === "mobile" && "opacity-100"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={cn(
                    deviceType === "mobile" ? "max-w-[95vw]" : "max-w-md"
                  )}>
                    <DialogHeader>
                      <DialogTitle>{title} - Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {description && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Description</h4>
                          <p className="text-sm text-gray-600">{description}</p>
                        </div>
                      )}
                      
                      {previousValue && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Previous Period</h4>
                          <p className="text-sm text-gray-600">
                            {typeof previousValue === "number" ? previousValue.toLocaleString() : previousValue}
                            {unit && ` ${unit}`}
                          </p>
                        </div>
                      )}

                      {trendData && trendData.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Trend Analysis</h4>
                          <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData}>
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke={getChartColor()}
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                />
                                <Tooltip 
                                  labelFormatter={(label) => `Period: ${label}`}
                                  formatter={(value: any) => [
                                    `${typeof value === "number" ? value.toLocaleString() : value}${unit ? ` ${unit}` : ''}`,
                                    'Value'
                                  ]}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {insights.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Insights</h4>
                          <ul className="space-y-1">
                            {insights.map((insight, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {link && (
                        <Button asChild className="w-full">
                          <Link href={link} onClick={() => setDetailsOpen(false)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Main value display */}
            <div className="flex items-baseline gap-2 mb-2">
              <div className={cn(
                "font-bold text-gray-900",
                deviceType === "mobile" ? "text-3xl" : "text-2xl"
              )}>
                {typeof value === "number" ? value.toLocaleString() : value}
                {unit && (
                  <span className={cn(
                    "font-normal text-gray-500 ml-1",
                    deviceType === "mobile" ? "text-lg" : "text-base"
                  )}>
                    {unit}
                  </span>
                )}
              </div>
            </div>

            {/* Enhanced trend display */}
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 mb-2",
                getTrendColor(),
                deviceType === "mobile" ? "text-sm" : "text-xs"
              )}>
                {getTrendIcon()}
                <span className="font-medium">
                  {Math.abs(trend)}%
                </span>
                <span className={cn(
                  "text-gray-500",
                  deviceType === "mobile" ? "hidden" : "inline"
                )}>
                  vs last period
                </span>
                {previousValue && (
                  <span className="text-gray-400 ml-auto text-xs">
                    was {typeof previousValue === "number" ? previousValue.toLocaleString() : previousValue}
                  </span>
                )}
              </div>
            )}

            {/* Target progress bar */}
            <TargetProgressBar />

            {/* Mini chart */}
            <MiniChart />

            {/* Spacer to push content to bottom */}
            <div className="flex-1" />
            
          </>
        )}
      </CardContent>
    </Card>
  );

  if (link) {
    return (
      <div onClick={() => window.location.href = link}>
        {content}
      </div>
    );
  }

  return content;
}

// Enhanced responsive skeleton for loading state
export function KpiCardSkeleton() {
  const { deviceType } = useResponsive();
  
  return (
    <Card className="border-l-4 border-l-gray-300">
      <CardContent className={cn(
        deviceType === "mobile" ? "p-4" : "p-4",
        "min-h-[140px] flex flex-col"
      )}>
        <div className="space-y-3 flex-1">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className={cn(
              "bg-gray-200 rounded animate-pulse",
              deviceType === "mobile" ? "h-5 w-32" : "h-4 w-28"
            )}></div>
            <div className="bg-gray-200 rounded animate-pulse h-6 w-6"></div>
          </div>
          
          {/* Value skeleton */}
          <div className={cn(
            "bg-gray-200 rounded animate-pulse",
            deviceType === "mobile" ? "h-12 w-24" : "h-10 w-20"
          )}></div>
          
          {/* Trend skeleton */}
          <div className={cn(
            "bg-gray-200 rounded animate-pulse w-20",
            deviceType === "mobile" ? "h-4" : "h-3"
          )}></div>
          
          {/* Progress bar skeleton */}
          <div className="space-y-1">
            <div className="bg-gray-200 rounded animate-pulse h-3 w-full"></div>
            <div className="bg-gray-200 rounded animate-pulse h-1.5 w-full"></div>
          </div>
          
          {/* Chart skeleton */}
          <div className={cn(
            "bg-gray-200 rounded animate-pulse w-full",
            deviceType === "mobile" ? "h-8" : "h-6"
          )}></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Responsive grid container for KPI cards
export function KpiGrid({ children }: { children: React.ReactNode }) {
  const { deviceType } = useResponsive();

  // Dynamic grid based on content density and device type
  const childCount = React.Children.count(children);
  const getGridColumns = () => {
    if (childCount <= 2) return deviceType === 'mobile' ? 1 : deviceType === 'tablet' ? 2 : 2;
    if (childCount <= 4) return deviceType === 'mobile' ? 1 : deviceType === 'tablet' ? 2 : 4;
    return deviceType === 'mobile' ? 1 : deviceType === 'tablet' ? 2 : 3;
  };
  const gridColumns = getGridColumns();
  
  return (
    <div className={cn(
      "grid gap-4 mb-6",
      deviceType === 'mobile' ? `grid-cols-1` :
      deviceType === 'tablet' ? `grid-cols-2` :
      `grid-cols-${gridColumns}`,
      // Ensure equal height cards
      "auto-rows-fr"
    )}>
      {children}
    </div>
  );
}