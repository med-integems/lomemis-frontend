"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
} from "lucide-react";
import Link from "next/link";

// Helper function to get status icon
const getStatusIcon = (status?: "pending" | "confirmed" | "sent" | "dispatched" | "low" | "critical") => {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "sent":
    case "dispatched":
      return <Truck className="h-4 w-4 text-blue-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "critical":
    case "low":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <CheckCircle className="h-4 w-4 text-gray-400" />;
  }
};

// Define valid route patterns to avoid 404s
const validRoutePatterns = [
  /^\/dashboard\/?$/,
  /^\/admin\/?$/,
  /^\/admin\/(audit-trail|councils|items|schools|users|warehouses|data-quality|stuck-receipts)\/?$/,
  /^\/councils\/?$/,
  /^\/councils\/(distributions|inventory|receipts|schools)\/?$/,
  /^\/councils\/\d+\/(distributions|inventory|receipts|schools)\/?$/,
  /^\/schools\/?$/,
  /^\/schools\/(inventory|receipts|manage)\/?$/,
  /^\/schools\/\d+\/(inventory|receipts)\/?$/,
  /^\/distributions\/?$/,
  /^\/distributions\/\d+\/?$/,
  /^\/distributions\/create\/?$/,
  /^\/shipments\/?$/,
  /^\/shipments\/\d+\/?$/,
  /^\/shipments\/create\/?$/,
  /^\/inventory\/?$/,
  /^\/inventory\/(councils|national)\/?$/,
  /^\/warehouse\/?$/,
  /^\/warehouse\/(direct-shipments|receipts)\/?$/,
  /^\/warehouse\/(direct-shipments|receipts)\/\d+\/?$/,
  /^\/warehouses\/?$/,
  /^\/warehouses\/schools\/?$/,
  /^\/reports\/?$/,
  /^\/reports\/(builder|custom|downloads|export|my-reports|standard)\/?$/,
  /^\/profile\/?$/,
];

// Helper function to check if a route pattern is valid
function isValidRoute(path: string): boolean {
  // Handle empty or invalid paths
  if (!path || typeof path !== 'string') return false;
  
  // Clean the path
  const cleanPath = path.trim();
  
  // Check against known patterns
  return validRoutePatterns.some(pattern => pattern.test(cleanPath));
}

interface ListItem {
  label: string;
  sublabel?: string;
  value: string | number;
  link: string;
  status?: "pending" | "confirmed" | "sent" | "dispatched" | "low" | "critical";
}

interface ListCardProps {
  title: string;
  items: ListItem[];
  loading?: boolean;
  emptyMessage?: string;
  readOnly?: boolean;
}

export function ListCard({
  title,
  items,
  loading = false,
  emptyMessage = "No items to display",
  readOnly = false,
}: ListCardProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "sent":
      case "dispatched":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "low":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "sent":
      case "dispatched":
        return "default" as const;
      case "critical":
        return "destructive" as const;
      case "low":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "sent":
        return "Sent";
      case "dispatched":
        return "Dispatched";
      case "critical":
        return "Critical";
      case "low":
        return "Low Stock";
      default:
        return status;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 px-6 pb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 pb-6">
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) =>
              readOnly ? (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(item.status)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div className="text-sm text-gray-500 truncate">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {item.value}
                      </div>
                      {item.status && (
                        <Badge
                          variant={getStatusBadgeVariant(item.status)}
                          className="text-xs"
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Check if the link is valid (basic route existence check)
                isValidRoute(item.link) ? (
                  <Link key={index} href={item.link}>
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(item.status)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {item.label}
                          </div>
                          {item.sublabel && (
                            <div className="text-sm text-gray-500 truncate">
                              {item.sublabel}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {item.value}
                          </div>
                          {item.status && (
                            <Badge
                              variant={getStatusBadgeVariant(item.status)}
                              className="text-xs"
                            >
                              {getStatusLabel(item.status)}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  // Display as non-clickable item for invalid routes (no chevron arrow)
                  <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(item.status)}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {item.label}
                        </div>
                        {item.sublabel && (
                          <div className="text-sm text-gray-500 truncate">
                            {item.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {item.value}
                        </div>
                        {item.status && (
                          <Badge
                            variant={getStatusBadgeVariant(item.status)}
                            className="text-xs"
                          >
                            {getStatusLabel(item.status)}
                          </Badge>
                        )}
                      </div>
                      {/* No ChevronRight icon for invalid routes */}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton for loading state
export function ListCardSkeleton({ title }: { title: string }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right space-y-1">
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Action button for lists that need actions
interface ActionListCardProps extends ListCardProps {
  actionLabel?: string;
  onAction?: (item: ListItem) => void;
}

export function ActionListCard({
  title,
  items,
  actionLabel = "Action",
  onAction,
  loading = false,
  emptyMessage = "No items to display",
}: ActionListCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border-b border-gray-100"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 pb-6">
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
              >
                {isValidRoute(item.link) ? (
                  <Link
                    href={item.link}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {getStatusIcon(item.status)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div className="text-sm text-gray-500 truncate">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {item.value}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(item.status)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div className="text-sm text-gray-500 truncate">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {item.value}
                    </div>
                  </div>
                )}
                {onAction && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction(item)}
                    className="ml-2"
                  >
                    {actionLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
