"use client";

import { Info, MapPin, Building2, School } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/hooks/usePermissions";
import { useResponsive } from "@/hooks/useResponsive";

interface ScopeIndicatorProps {
  type: "district" | "council" | "warehouse" | "school" | "all";
  scopeName?: string;
  dataType: string;
  className?: string;
}

export function ScopeIndicator({
  type,
  scopeName,
  dataType,
  className,
}: ScopeIndicatorProps) {
  const { user, isDistrictOfficer } = usePermissions();
  const { isMobile, deviceType } = useResponsive();

  if (!user) return null;

  const getIcon = () => {
    const iconSize = deviceType === "mobile" ? "h-3 w-3" : "h-4 w-4";
    switch (type) {
      case "district":
        return <MapPin className={iconSize} />;
      case "council":
        return <Building2 className={iconSize} />;
      case "warehouse":
        return <Building2 className={iconSize} />;
      case "school":
        return <School className={iconSize} />;
      default:
        return <Info className={iconSize} />;
    }
  };

  const getMessage = () => {
    if (type === "all") {
      return `Showing all ${dataType} across the system`;
    }

    const scopeText = scopeName || "your assigned";

    switch (type) {
      case "district":
        return `Showing ${dataType} for ${scopeText} district`;
      case "council":
        return `Showing ${dataType} for ${scopeText} local council`;
      case "warehouse":
        return `Showing ${dataType} for ${scopeText} warehouse`;
      case "school":
        return `Showing ${dataType} for ${scopeText} school`;
      default:
        return `Showing ${dataType} for ${scopeText} ${type}`;
    }
  };

  return (
    <Alert className={`mb-4 border-blue-200 bg-blue-50 ${className || ""}`}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <AlertDescription className={`text-blue-800 ${deviceType === "mobile" ? "text-sm" : ""}`}>
          <div className={deviceType === "mobile" ? "space-y-1" : ""}>
            <div>{getMessage()}</div>
            {(type === "district" || type === "council") && (
              <div className={`${deviceType === "mobile" ? "text-xs" : "text-sm"} text-blue-600`}>
                (You can manually adjust filters if needed)
              </div>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}