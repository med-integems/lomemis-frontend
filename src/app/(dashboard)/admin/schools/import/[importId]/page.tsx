"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Users,
  MapPin,
  Play,
  Square,
  RotateCcw,
  Download
} from "lucide-react";
import {
  useImportStatus,
  useImportRows,
  useCommitImport,
  useCancelImport,
  useRollbackImport,
  useCouncilHierarchy
} from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SchoolStagingRowRecord, ImportStatusSummary } from "@/types";
import { CouncilMappingDialog } from "@/components/admin/council-mapping-dialog";
import { use } from "react";

interface Props {
  params: Promise<{ importId: string }>;
}

export default function ImportReviewPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const importRunId = parseInt(resolvedParams.importId);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({});
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedRows, setSelectedRows] = useState<SchoolStagingRowRecord[]>([]);
  const [showCouncilMapping, setShowCouncilMapping] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError
  } = useImportStatus(importRunId);

  const {
    data: rowsData,
    isLoading: rowsLoading
  } = useImportRows(importRunId, currentPage, pageSize, filters);

  const {
    data: councilHierarchy
  } = useCouncilHierarchy();

  const commitMutation = useCommitImport();
  const cancelMutation = useCancelImport();
  const rollbackMutation = useRollbackImport();

  const importStatus = statusData?.data as ImportStatusSummary | undefined;
  const stagingRows = rowsData?.data?.rows || [];

  useEffect(() => {
    if (statusError) {
      router.push("/admin/schools/import");
    }
  }, [statusError, router]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      UPLOADED: { variant: "secondary", icon: Clock, label: "Uploaded" },
      PROCESSING: { variant: "secondary", icon: Clock, label: "Processing" },
      READY_FOR_REVIEW: { variant: "outline", icon: AlertTriangle, label: "Ready for Review" },
      READY_TO_COMMIT: { variant: "default", icon: Play, label: "Ready to Commit" },
      COMMITTED: { variant: "default", icon: CheckCircle, label: "Committed" },
      CANCELLED: { variant: "destructive", icon: Square, label: "Cancelled" },
      FAILED: { variant: "destructive", icon: AlertTriangle, label: "Failed" },
      ROLLED_BACK: { variant: "secondary", icon: RotateCcw, label: "Rolled Back" }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UPLOADED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getValidationStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary", label: "Pending" },
      VALID: { variant: "default", label: "Valid" },
      ERROR: { variant: "destructive", label: "Error" },
      REQUIRES_REVIEW: { variant: "outline", label: "Needs Review" }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMatchTypeBadge = (matchType: string) => {
    const typeConfig = {
      NONE: { variant: "secondary", label: "No Match" },
      EXACT: { variant: "default", label: "Exact" },
      ALIAS: { variant: "outline", label: "Alias" },
      FUZZY: { variant: "secondary", label: "Fuzzy" },
      MANUAL: { variant: "default", label: "Manual" }
    } as const;

    const config = typeConfig[matchType as keyof typeof typeConfig] || typeConfig.NONE;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCommit = async () => {
    if (!importRunId) return;

    try {
      await commitMutation.mutateAsync({
        importRunId,
        commitData: { confirmOverwrites: true }
      });
      setShowCommitConfirm(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = async () => {
    if (!importRunId) return;

    try {
      await cancelMutation.mutateAsync(importRunId);
      setShowCancelConfirm(false);
      router.push("/admin/schools/import");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRollback = async () => {
    if (!importRunId) return;

    try {
      await rollbackMutation.mutateAsync(importRunId);
      setShowRollbackConfirm(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRowSelection = (row: SchoolStagingRowRecord, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, row]);
    } else {
      setSelectedRows(prev => prev.filter(r => r.id !== row.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(stagingRows.filter((row: SchoolStagingRowRecord) => row.matchType === "NONE"));
    } else {
      setSelectedRows([]);
    }
  };

  const handleMapSelectedCouncils = () => {
    const unmappedRows = selectedRows.filter(row => row.matchType === "NONE");
    if (unmappedRows.length === 0) {
      alert("Please select rows that need council mapping");
      return;
    }
    setShowCouncilMapping(true);
  };

  const handleCouncilMappingSuccess = () => {
    setSelectedRows([]);
    // Refresh the data
  };

  if (statusLoading) {
    return <ImportReviewSkeleton />;
  }

  if (!importStatus) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Import run not found or you don&apos;t have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Import Review</h1>
            <p className="text-muted-foreground">
              {importStatus.importRun.fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(importStatus.importRun.status)}
          {importStatus.importRun.dryRun && (
            <Badge variant="outline">Dry Run</Badge>
          )}
          {importStatus.importRun.authoritative && (
            <Badge variant="secondary">Authoritative</Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {importStatus.importRun.status === "READY_TO_COMMIT" && (
          <Button
            onClick={() => setShowCommitConfirm(true)}
            disabled={commitMutation.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            Commit Changes
          </Button>
        )}

        {["UPLOADED", "PROCESSING", "READY_FOR_REVIEW", "READY_TO_COMMIT"].includes(
          importStatus.importRun.status
        ) && (
          <Button
            variant="destructive"
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelMutation.isPending}
          >
            <Square className="h-4 w-4 mr-2" />
            Cancel Import
          </Button>
        )}

        {importStatus.importRun.status === "COMMITTED" && (
          <Button
            variant="outline"
            onClick={() => setShowRollbackConfirm(true)}
            disabled={rollbackMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Rollback
          </Button>
        )}

        {selectedRows.length > 0 && (
          <Button
            variant="outline"
            onClick={handleMapSelectedCouncils}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Map {selectedRows.length} Council{selectedRows.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importStatus.progress.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {importStatus.progress.processed}
            </div>
            <Progress
              value={importStatus.progress.percentage}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {importStatus.validationSummary.validRows}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {importStatus.validationSummary.errorRows}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Review */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data Review</TabsTrigger>
          <TabsTrigger value="councils">Council Mapping</TabsTrigger>
          <TabsTrigger value="errors">Validation Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Import Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Import Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Size:</span>
                  <span className="text-sm font-medium">
                    {(importStatus.importRun.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Started:</span>
                  <span className="text-sm font-medium">
                    {new Date(importStatus.importRun.startedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="text-sm font-medium">
                    {importStatus.importRun.importType}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Council Mapping Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Council Mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Exact Matches:</span>
                  <span className="text-sm font-medium text-green-600">
                    {importStatus.councilMappingSummary.exactMatches}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Alias Matches:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {importStatus.councilMappingSummary.aliasMatches}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Manual Review:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {importStatus.councilMappingSummary.unchecked}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Review</CardTitle>
              <CardDescription>
                Review all imported rows and their validation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Actions */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <Select onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="VALID">Valid</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                      <SelectItem value="REQUIRES_REVIEW">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select onValueChange={(value) => setFilters({ ...filters, matchMethod: value })}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by match" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Matches</SelectItem>
                      <SelectItem value="EXACT">Exact</SelectItem>
                      <SelectItem value="ALIAS">Alias</SelectItem>
                      <SelectItem value="FUZZY">Fuzzy</SelectItem>
                      <SelectItem value="NONE">No Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedRows.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            stagingRows.filter((row: SchoolStagingRowRecord) => row.matchType === "NONE").length > 0 &&
                            stagingRows.filter((row: SchoolStagingRowRecord) => row.matchType === "NONE").every((row: SchoolStagingRowRecord) =>
                              selectedRows.some((selected: SchoolStagingRowRecord) => selected.id === row.id)
                            )
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Row</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Council</TableHead>
                      <TableHead>EMIS Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Council Match</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : stagingRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      stagingRows.map((row: SchoolStagingRowRecord) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.some(selected => selected.id === row.id)}
                              onCheckedChange={(checked) => handleRowSelection(row, !!checked)}
                              disabled={row.matchType !== "NONE"}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.fileRowNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.schoolName}
                          </TableCell>
                          <TableCell>{row.council}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.emisCode}
                          </TableCell>
                          <TableCell>
                            {getValidationStatusBadge(row.validationStatus)}
                          </TableCell>
                          <TableCell>
                            {getMatchTypeBadge(row.matchType)}
                          </TableCell>
                          <TableCell>
                            {row.matchType === "NONE" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRows([row]);
                                  setShowCouncilMapping(true);
                                }}
                              >
                                Map Council
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {Math.ceil((rowsData?.data?.total || 0) / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= Math.ceil((rowsData?.data?.total || 0) / pageSize)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="councils">
          <Card>
            <CardHeader>
              <CardTitle>Council Mapping</CardTitle>
              <CardDescription>
                Review and resolve council mapping issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CouncilMappingContent
                importRunId={importRunId}
                councilHierarchy={councilHierarchy?.data}
                isLoading={rowsLoading}
                onMappingSuccess={() => {
                  // Refresh data when mapping is successful
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Validation Errors</CardTitle>
              <CardDescription>
                Review validation errors that need to be addressed before committing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ValidationErrorsContent
                importRunId={importRunId}
                isLoading={rowsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Council Mapping Dialog */}
      <CouncilMappingDialog
        open={showCouncilMapping}
        onOpenChange={setShowCouncilMapping}
        selectedRows={selectedRows}
        councilHierarchy={councilHierarchy?.data}
        importRunId={importRunId}
        onSuccess={handleCouncilMappingSuccess}
      />

      {/* Commit Confirmation Dialog */}
      <AlertDialog open={showCommitConfirm} onOpenChange={setShowCommitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Commit Import Changes</AlertDialogTitle>
            <AlertDialogDescription>
              This will apply all validated changes to the schools database. This action cannot be undone easily.
              <br /><br />
              <strong>Summary:</strong>
              <ul className="mt-2 space-y-1">
                <li>• {importStatus?.progress.successful || 0} valid rows will be processed</li>
                <li>• Schools will be created or updated based on the import data</li>
                <li>• Changes can be rolled back later if needed</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCommit}
              disabled={commitMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {commitMutation.isPending ? "Committing..." : "Commit Changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Import</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the import and discard all uploaded data. This action cannot be undone.
              <br /><br />
              Are you sure you want to cancel this import?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Import</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rollback Confirmation Dialog */}
      <AlertDialog open={showRollbackConfirm} onOpenChange={setShowRollbackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback Import</AlertDialogTitle>
            <AlertDialogDescription>
              This will undo all changes made by this import, reverting schools to their previous state.
              This action cannot be undone.
              <br /><br />
              Are you sure you want to rollback this import?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Changes</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {rollbackMutation.isPending ? "Rolling back..." : "Rollback Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Validation Errors Tab Component
function ValidationErrorsContent({ importRunId, isLoading }: { importRunId: number; isLoading: boolean }) {
  const {
    data: errorRowsData,
    isLoading: errorRowsLoading
  } = useImportRows(importRunId, 1, 100, { status: "ERROR" });

  const errorRows = errorRowsData?.data?.rows || [];

  if (isLoading || errorRowsLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (errorRows.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          No validation errors found! All rows have passed validation.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {errorRows.length} row{errorRows.length > 1 ? 's' : ''} with validation errors
        </h3>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>School Name</TableHead>
              <TableHead>EMIS Code</TableHead>
              <TableHead>Council</TableHead>
              <TableHead>Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errorRows.map((row: SchoolStagingRowRecord) => {
              let validationErrors: any[] = [];
              try {
                // Check if validationErrors is already an array or a JSON string
                if (Array.isArray(row.validationErrors)) {
                  validationErrors = row.validationErrors;
                } else if (typeof row.validationErrors === 'string') {
                  validationErrors = JSON.parse(row.validationErrors);
                } else {
                  validationErrors = [];
                }
              } catch (e) {
                validationErrors = [];
              }

              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    {row.fileRowNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.schoolName || <span className="text-muted-foreground">Missing</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.emisCode || <span className="text-muted-foreground">Missing</span>}
                  </TableCell>
                  <TableCell>
                    {row.council || <span className="text-muted-foreground">Missing</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {validationErrors.map((error: any, index: number) => (
                        <div key={index} className="text-xs">
                          <Badge variant="destructive" className="mr-1">
                            {error.field || 'General'}
                          </Badge>
                          <span className="text-muted-foreground">
                            {error.message || 'Validation error'}
                          </span>
                        </div>
                      ))}
                      {validationErrors.length === 0 && (
                        <span className="text-xs text-muted-foreground">No specific errors recorded</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> These errors must be resolved before the import can be committed.
          You may need to fix the data in your source file and re-upload.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Council Mapping Tab Component
function CouncilMappingContent({
  importRunId,
  councilHierarchy,
  isLoading,
  onMappingSuccess
}: {
  importRunId: number;
  councilHierarchy: any;
  isLoading: boolean;
  onMappingSuccess: () => void;
}) {
  const {
    data: unmappedRowsData,
    isLoading: unmappedRowsLoading
  } = useImportRows(importRunId, 1, 100, { matchMethod: "NONE" });

  const unmappedRows = unmappedRowsData?.data?.rows || [];
  const [selectedRows, setSelectedRows] = useState<SchoolStagingRowRecord[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);

  if (isLoading || unmappedRowsLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (unmappedRows.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          All councils have been successfully mapped! No manual mapping required.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(unmappedRows);
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelection = (row: SchoolStagingRowRecord, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, row]);
    } else {
      setSelectedRows(prev => prev.filter(r => r.id !== row.id));
    }
  };

  const uniqueCouncilNames: string[] = Array.from(
    new Set(unmappedRows.map((row: SchoolStagingRowRecord) => row.council).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {unmappedRows.length} row{unmappedRows.length > 1 ? 's' : ''} with unmapped councils
          </h3>
          <p className="text-sm text-muted-foreground">
            {uniqueCouncilNames.length} unique council name{uniqueCouncilNames.length > 1 ? 's' : ''} need mapping
          </p>
        </div>
        {selectedRows.length > 0 && (
          <Button
            onClick={() => setShowMappingDialog(true)}
            disabled={selectedRows.length === 0}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Map {selectedRows.length} Selected
          </Button>
        )}
      </div>

      {/* Summary of unique council names */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unmapped Council Names</CardTitle>
          <CardDescription>
            These council names from your file don&apos;t match any councils in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {uniqueCouncilNames.map((councilName: string, index: number) => {
              const rowCount = unmappedRows.filter((row: SchoolStagingRowRecord) => row.council === councilName).length;
              return (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{councilName}</span>
                  <Badge variant="outline">{rowCount} school{rowCount > 1 ? 's' : ''}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed rows */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={unmappedRows.length > 0 && selectedRows.length === unmappedRows.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Row</TableHead>
              <TableHead>School Name</TableHead>
              <TableHead>Council (From File)</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unmappedRows.map((row: SchoolStagingRowRecord) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.some(selected => selected.id === row.id)}
                    onCheckedChange={(checked) => handleRowSelection(row, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.fileRowNumber}
                </TableCell>
                <TableCell className="font-medium">
                  {row.schoolName}
                </TableCell>
                <TableCell className="font-medium text-orange-600">
                  {row.council}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.region}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.district}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRows([row]);
                      setShowMappingDialog(true);
                    }}
                  >
                    Map Council
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Select multiple rows with the same council name to map them all at once.
          The mapping will be applied to all selected schools.
        </AlertDescription>
      </Alert>

      {/* Council Mapping Dialog */}
      <CouncilMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        selectedRows={selectedRows}
        councilHierarchy={councilHierarchy}
        importRunId={importRunId}
        onSuccess={() => {
          setSelectedRows([]);
          onMappingSuccess();
        }}
      />
    </div>
  );
}

function ImportReviewSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}