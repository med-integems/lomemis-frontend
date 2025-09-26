"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  History,
  User,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApi";
import { stockReceiptApi } from "@/lib/api";

interface AuditEntry {
  id: string;
  receiptId: number;
  eventType:
    | "creation"
    | "status_change"
    | "quality_check"
    | "validation"
    | "modification";
  eventDate: string;
  userId: number;
  userName: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}

interface ReceiptAuditTrailProps {
  receiptId: number;
  className?: string;
  refreshTrigger?: number; // Add this to trigger refreshes
}

export function ReceiptAuditTrail({
  receiptId,
  className = "",
  refreshTrigger,
}: ReceiptAuditTrailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: auditResponse,
    isLoading,
    error,
  } = useApiQuery(
    ["receipt-audit-trail", receiptId, refreshTrigger],
    () => stockReceiptApi.getReceiptAuditTrail(receiptId),
    {
      enabled: !!receiptId,
      staleTime: 0, // Don't use stale data, always refetch
    }
  );

  const auditEntries: AuditEntry[] = auditResponse?.success
    ? auditResponse.data || []
    : [];

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "creation":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "status_change":
      case "validation":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "quality_check":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "modification":
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "creation":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "status_change":
      case "validation":
        return "bg-green-100 text-green-800 border-green-200";
      case "quality_check":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "modification":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-800">
              Failed to load audit trail. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const displayedEntries = isExpanded ? auditEntries : auditEntries.slice(0, 5);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Trail ({auditEntries.length})
          </CardTitle>
          {auditEntries.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show All
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Complete history of all changes and activities for this receipt
        </p>
      </CardHeader>
      <CardContent>
        {auditEntries.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No audit trail available
            </h3>
            <p className="text-gray-500">
              No activities have been recorded for this receipt yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  index === 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                {/* Event Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(entry.eventType)}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getEventBadgeColor(entry.eventType)}>
                      {formatEventType(entry.eventType)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.eventDate).toLocaleString()}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {entry.description}
                  </p>

                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <User className="w-3 h-3" />
                    {entry.userName}
                  </div>

                  {/* Value Changes */}
                  {(entry.oldValue || entry.newValue) && (
                    <div className="text-sm space-y-1">
                      {entry.oldValue && (
                        <div className="text-red-600">
                          <span className="font-medium">From:</span>{" "}
                          {entry.oldValue}
                        </div>
                      )}
                      {entry.newValue && (
                        <div className="text-green-600">
                          <span className="font-medium">To:</span>{" "}
                          {entry.newValue}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {entry.notes && (
                    <div className="mt-2 p-2 bg-white rounded border text-sm">
                      <span className="font-medium text-gray-700">Notes:</span>
                      <p className="text-gray-600 mt-1">{entry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show More/Less Button */}
            {auditEntries.length > 5 && !isExpanded && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Show {auditEntries.length - 5} More Entries
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReceiptAuditTrail;
