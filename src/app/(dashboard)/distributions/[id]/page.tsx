"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Package,
  GraduationCap,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
} from "lucide-react";
import { distributionsApi } from "@/lib/api";
import { DistributionWithDetails } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useResponsive } from "@/hooks/useResponsive";

export default function DistributionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const from = searchParams.get("from") || "/distributions";
  const preservedQuery = (() => {
    const entries = Array.from(searchParams.entries());
    const keep = entries.filter(([k]) =>
      [
        "from",
        "page",
        "search",
        "status",
        "localCouncilId",
        "schoolId",
        "schoolType",
        "startDate",
        "endDate",
      ].includes(k)
    );
    const q = new URLSearchParams(keep as any);
    return q.toString();
  })();
  const distributionId = parseInt(params.id as string);

  const [distribution, setDistribution] =
    useState<DistributionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (distributionId) {
      fetchDistributionDetails();
    }
  }, [distributionId]);

  const fetchDistributionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await distributionsApi.getDistributionById(
        distributionId
      );

      if (response.success) {
        setDistribution(response.data);
      } else {
        setError("Failed to load distribution details");
      }
    } catch (err) {
      console.error("Error fetching distribution details:", err);
      setError("Failed to load distribution details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "DISTRIBUTED":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "DISCREPANCY":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <FileText className="h-4 w-4" />;
      case "DISTRIBUTED":
        return <Package className="h-4 w-4" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "DISCREPANCY":
        return <AlertCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}>
          <Skeleton className={`${isMobile ? 'h-6 w-48' : 'h-8 w-64'}`} />
          {!isMobile && <Skeleton className="h-10 w-32" />}
        </div>
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !distribution) {
    return (
      <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
        <div className="flex items-center gap-4">
          <Link href={`${from}?${preservedQuery}`}>
            <Button variant="outline" size="sm" className={`${isMobile ? 'h-10' : ''}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Distributions
            </Button>
          </Link>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Distribution not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4 px-4' : 'space-y-6'}`}>
      {/* Header */}
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
        <div className={`flex items-center gap-4 ${isMobile ? 'flex-col items-start space-y-3 gap-0' : ''}`}>
          <Link href={`${from}?${preservedQuery}`}>
            <Button variant="outline" size="sm" className={`${isMobile ? 'h-10 self-start' : ''}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Distributions
            </Button>
          </Link>
          <div>
            <h1 className={`font-bold text-foreground ${
              isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
            }`}>
              Distribution {distribution.distributionNumber}
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              {isMobile ? "Track details and confirmations" : "Track distribution details and school confirmations"}
            </p>
          </div>
        </div>
        <Badge
          className={`${getStatusColor(
            distribution.status
          )} flex items-center gap-2 ${
            isMobile ? 'self-start' : ''
          }`}
        >
          {getStatusIcon(distribution.status)}
          {distribution.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className={`grid gap-6 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {/* Distribution Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Distribution Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Distribution Number:
              </span>
              <span className="font-semibold">
                {distribution.distributionNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Total Items:
              </span>
              <span className="font-semibold">{distribution.totalItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Created:
              </span>
              <span className="font-semibold">
                {new Date(distribution.createdAt).toLocaleDateString()}
              </span>
            </div>
            {distribution.distributionDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Distributed:
                </span>
                <span className="font-semibold">
                  {new Date(distribution.distributionDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {distribution.confirmedDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Confirmed:
                </span>
                <span className="font-semibold">
                  {new Date(distribution.confirmedDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                From:
              </span>
              <p className="font-semibold">{distribution.councilName}</p>
            </div>
            <div className="flex justify-center">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                To:
              </span>
              <p className="font-semibold">{distribution.schoolName}</p>
              <p className="text-sm text-muted-foreground">
                {distribution.schoolCode}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Items */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
            <Package className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Distribution Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-3">
              {distribution.items?.map((item) => (
                <Card key={item.id} className="border border-border">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.itemCode} • {item.unitOfMeasure}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-muted-foreground">Distributed: </span>
                          <span className="font-semibold">{item.quantityDistributed}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confirmed: </span>
                          <span className="font-semibold">{item.quantityConfirmed || "-"}</span>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        {item.quantityConfirmed ? (
                          item.quantityConfirmed === item.quantityDistributed ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Discrepancy
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Item</th>
                  <th className="text-right p-2 font-medium">Code</th>
                  <th className="text-right p-2 font-medium">Distributed</th>
                  <th className="text-right p-2 font-medium">Confirmed</th>
                  <th className="text-right p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {distribution.items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.unitOfMeasure}
                        </p>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-mono">{item.itemCode}</span>
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {item.quantityDistributed}
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {item.quantityConfirmed || "-"}
                    </td>
                    <td className="p-2 text-right">
                      {item.quantityConfirmed ? (
                        item.quantityConfirmed === item.quantityDistributed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Discrepancy
                          </Badge>
                        )
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {(distribution.notes || distribution.discrepancyNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {distribution.notes && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Distribution Notes:
                </h4>
                <p className="text-sm">{distribution.notes}</p>
              </div>
            )}
            {distribution.discrepancyNotes && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  Discrepancy Notes:
                </h4>
                <p className="text-sm text-red-600">
                  {distribution.discrepancyNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personnel Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Created By:
              </span>
              <p className="font-semibold">{distribution.createdByName}</p>
            </div>
            {distribution.distributedByName && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Distributed By:
                </span>
                <p className="font-semibold">
                  {distribution.distributedByName}
                </p>
              </div>
            )}
            {distribution.confirmedByName && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Confirmed By:
                </span>
                <p className="font-semibold">{distribution.confirmedByName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
