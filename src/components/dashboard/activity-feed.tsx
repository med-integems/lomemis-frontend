"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  GraduationCap,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useResponsive } from "@/hooks/useResponsive";

export interface ActivityItem {
  id: string;
  type: "receipt" | "shipment" | "distribution" | "user_action";
  title: string;
  description: string;
  timestamp: string;
  user: string;
  status?: "success" | "warning" | "info" | "error";
  metadata?: {
    itemCount?: number;
    location?: string;
    reference?: string;
  };
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
  userRole?: string;
  maxItems?: number;
}

export function ActivityFeed({
  activities = [],
  isLoading,
  userRole,
  maxItems = 10,
}: ActivityFeedProps) {
  const { deviceType, isTouchDevice } = useResponsive();
  
  // Adjust maxItems for mobile to prevent overwhelming UI
  const responsiveMaxItems = deviceType === "mobile" ? Math.min(maxItems, 5) : maxItems;
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "receipt":
        return Package;
      case "shipment":
        return Truck;
      case "distribution":
        return GraduationCap;
      case "user_action":
        return User;
      default:
        return Info;
    }
  };

  const getStatusIcon = (status?: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertCircle;
      case "error":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status?: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const getBadgeVariant = (status?: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Filter activities based on user role if needed
  const filteredActivities = activities
    .slice(0, responsiveMaxItems)
    .filter((activity) => {
      // For now, show all activities to all roles
      // This can be enhanced based on specific requirements
      return true;
    });

  if (isLoading) {
    const skeletonCount = deviceType === "mobile" ? 3 : 5;
    
    return (
      <Card className={cn(
        isTouchDevice && "touch-manipulation"
      )}>
        <CardHeader className={cn(
          deviceType === "mobile" && "pb-3"
        )}>
          <CardTitle className={cn(
            "font-semibold",
            deviceType === "mobile" ? "text-xl" : "text-lg"
          )}>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            deviceType === "mobile" ? "space-y-5" : "space-y-4"
          )}>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div key={index} className={cn(
                "flex items-start",
                deviceType === "mobile" ? "space-x-4" : "space-x-3"
              )}>
                <Skeleton className={cn(
                  "rounded-full",
                  deviceType === "mobile" ? "h-10 w-10" : "h-8 w-8"
                )} />
                <div className="flex-1 space-y-2">
                  <Skeleton className={cn(
                    "w-3/4",
                    deviceType === "mobile" ? "h-5" : "h-4"
                  )} />
                  <Skeleton className={cn(
                    "w-1/2",
                    deviceType === "mobile" ? "h-4" : "h-3"
                  )} />
                </div>
                <Skeleton className={cn(
                  "w-16",
                  deviceType === "mobile" ? "h-4" : "h-3"
                )} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredActivities.length === 0) {
    return (
      <Card className={cn(
        isTouchDevice && "touch-manipulation"
      )}>
        <CardHeader className={cn(
          deviceType === "mobile" && "pb-3"
        )}>
          <CardTitle className={cn(
            "font-semibold",
            deviceType === "mobile" ? "text-xl" : "text-lg"
          )}>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-center",
            deviceType === "mobile" ? "py-10" : "py-8"
          )}>
            <Clock className={cn(
              "text-muted-foreground mx-auto mb-4",
              deviceType === "mobile" ? "h-16 w-16" : "h-12 w-12"
            )} />
            <p className={cn(
              "text-muted-foreground",
              deviceType === "mobile" ? "text-base" : "text-sm"
            )}>
              No recent activity to display
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      isTouchDevice && "touch-manipulation"
    )}>
      <CardHeader className={cn(
        deviceType === "mobile" && "pb-3"
      )}>
        <CardTitle className={cn(
          "font-semibold",
          deviceType === "mobile" ? "text-xl" : "text-lg"
        )}>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(
          // Responsive height
          deviceType === "mobile" ? "h-80" : "h-96",
          // Touch scroll optimization
          isTouchDevice && "touch-pan-y"
        )}>
          <div className={cn(
            deviceType === "mobile" ? "space-y-5" : "space-y-4"
          )}>
            {filteredActivities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const StatusIcon = getStatusIcon(activity.status);

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start border-b border-border last:border-b-0",
                    deviceType === "mobile" ? "space-x-4 pb-5" : "space-x-3 pb-4"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "flex items-center justify-center rounded-full bg-primary/10",
                      deviceType === "mobile" ? "h-10 w-10" : "h-8 w-8"
                    )}>
                      <ActivityIcon className={cn(
                        "text-primary",
                        deviceType === "mobile" ? "h-5 w-5" : "h-4 w-4"
                      )} />
                    </div>
                    {activity.status && (
                      <div className="absolute -bottom-1 -right-1">
                        <StatusIcon
                          className={cn(
                            getStatusColor(activity.status),
                            deviceType === "mobile" ? "h-4 w-4" : "h-3 w-3"
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-foreground",
                          deviceType === "mobile" ? "text-base" : "text-sm"
                        )}>
                          {activity.title}
                        </p>
                        <p className={cn(
                          "text-muted-foreground mt-1",
                          deviceType === "mobile" ? "text-sm" : "text-sm"
                        )}>
                          {activity.description}
                        </p>

                        {activity.metadata && (
                          <div className={cn(
                            "flex flex-wrap items-center gap-1.5 mt-2",
                            // Stack badges on mobile for better readability
                            deviceType === "mobile" && "flex-col items-start gap-1"
                          )}>
                            {activity.metadata.itemCount && (
                              <Badge variant="outline" className={cn(
                                deviceType === "mobile" ? "text-xs" : "text-xs"
                              )}>
                                {activity.metadata.itemCount} items
                              </Badge>
                            )}
                            {activity.metadata.location && (
                              <Badge variant="outline" className={cn(
                                deviceType === "mobile" ? "text-xs" : "text-xs"
                              )}>
                                {activity.metadata.location}
                              </Badge>
                            )}
                            {activity.metadata.reference && (
                              <Badge variant="outline" className={cn(
                                deviceType === "mobile" ? "text-xs" : "text-xs"
                              )}>
                                {activity.metadata.reference}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className={cn(
                          "flex items-center justify-between mt-2",
                          // Stack on mobile for better readability
                          deviceType === "mobile" && "flex-col items-start gap-2"
                        )}>
                          <p className={cn(
                            "text-muted-foreground",
                            deviceType === "mobile" ? "text-sm" : "text-xs"
                          )}>
                            by {activity.user}
                          </p>
                          {activity.status && (
                            <Badge
                              variant={getBadgeVariant(activity.status)}
                              className={cn(
                                deviceType === "mobile" ? "text-xs" : "text-xs"
                              )}
                            >
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className={cn(
                        "text-muted-foreground flex-shrink-0",
                        deviceType === "mobile" ? "text-sm ml-2" : "text-xs ml-2"
                      )}>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
