"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  FileText,
  Clock,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  FileBarChart,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  getDownloads,
  updateDownload,
  removeDownload,
  type DownloadableReport,
} from "@/lib/downloads";
import { reportsApi } from "@/lib/api";

export function DownloadsPage() {
  useAuth();
  const [downloads, setDownloads] = useState<DownloadableReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize downloads on component mount
  useEffect(() => {
    setDownloads(getDownloads());

    // Listen for downloads updates
    const handleDownloadsUpdate = (event: CustomEvent) => {
      setDownloads(event.detail);
    };

    window.addEventListener(
      "downloads-updated",
      handleDownloadsUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "downloads-updated",
        handleDownloadsUpdate as EventListener
      );
    };
  }, []);

  // Filter downloads based on search and filters
  const filteredDownloads = downloads.filter((download) => {
    const matchesSearch =
      download.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      download.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || download.status === statusFilter;
    const matchesFormat =
      formatFilter === "all" || download.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case "csv":
        return <FileBarChart className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDownload = (download: DownloadableReport) => {
    if (download.status !== "completed" || !download.downloadUrl) {
      toast.error("Report is not available for download");
      return;
    }
    // Use authenticated API call to download the export as a blob.
    // This ensures the request uses the same axios instance (baseURL + auth headers).
    (async () => {
      try {
        // Extract filename portion (backend expects filename param).
        // Handle variations: /exports/filename.pdf, /api/reports/exports/filename.pdf,
        // or /api/reports/exports/123/download (some places used a trailing /download)
        if (!download.downloadUrl) throw new Error("Invalid download URL");
        const parts = download.downloadUrl.split("/").filter(Boolean);
        // Find a segment that contains a file extension (e.g. '.pdf' or '.xlsx' or '.csv')
        let filename = parts.reverse().find((p) => /\.[a-zA-Z0-9]+$/.test(p));
        if (!filename) {
          // If we have a trailing 'download', try the segment before it
          const reversed = parts; // already reversed
          if (reversed[1]) filename = reversed[1];
        }
        if (!filename)
          throw new Error("Invalid download URL: no filename found");
        filename = decodeURIComponent(filename);

        const blob = await reportsApi.downloadExport(filename);

        // Create object URL and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${download.name.toLowerCase().replace(/\s+/g, "-")}.${
          download.format
        }`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success(`Downloading ${download.name}`);
      } catch (err: unknown) {
        console.error("Download error:", err);
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message || "Failed to download report");
      }
    })();
  };

  const handleRetry = (downloadId: string) => {
    updateDownload(downloadId, {
      status: "processing",
      error: undefined,
    });

    // Simulate retry processing
    setTimeout(() => {
      updateDownload(downloadId, {
        status: "completed",
        completedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: "1.5 MB",
        downloadUrl: `/api/reports/exports/${downloadId}/download`,
      });
      toast.success("Report generation completed successfully");
    }, 3000);
  };

  const handleDelete = (downloadId: string) => {
    removeDownload(downloadId);
    toast.success("Report deleted successfully");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      // In real implementation, this would fetch from API
      setIsRefreshing(false);
      toast.success("Downloads refreshed");
    }, 1000);
  };

  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusCounts = () => {
    const counts = downloads.reduce((acc, download) => {
      acc[download.status] = (acc[download.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: downloads.length,
      completed: counts.completed || 0,
      processing: counts.processing || 0,
      failed: counts.failed || 0,
      expired: counts.expired || 0,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Downloads</h1>
        <p className="text-muted-foreground">
          Manage and download your generated reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.completed}
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.processing}
            </div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.failed}
            </div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-2xl font-bold text-orange-600">
              {statusCounts.expired}
            </div>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Reports
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Downloads List */}
      <div className="space-y-4">
        {filteredDownloads.length > 0 ? (
          filteredDownloads.map((download) => {
            const daysUntilExpiry = getDaysUntilExpiry(download.expiresAt);

            return (
              <Card
                key={download.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getFormatIcon(download.format)}
                        {getStatusIcon(download.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {download.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Generated by {download.generatedBy}</span>
                          <span>•</span>
                          <span>
                            {new Date(download.createdAt).toLocaleDateString()}
                          </span>
                          {download.recordCount && (
                            <>
                              <span>•</span>
                              <span>{download.recordCount} records</span>
                            </>
                          )}
                          {download.fileSize && (
                            <>
                              <span>•</span>
                              <span>{download.fileSize}</span>
                            </>
                          )}
                        </div>
                        {download.status === "completed" &&
                          daysUntilExpiry !== null && (
                            <p
                              className={`text-xs mt-1 ${
                                daysUntilExpiry <= 2
                                  ? "text-orange-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {daysUntilExpiry > 0
                                ? `Expires in ${daysUntilExpiry} days`
                                : "Expired"}
                            </p>
                          )}
                        {download.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {download.error}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(download.status)}

                      <div className="flex items-center gap-2">
                        {download.status === "completed" &&
                          download.downloadUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(download)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}

                        {download.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(download.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(download.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Download className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all" || formatFilter !== "all"
                  ? "No reports match your current filters."
                  : "You haven't generated any reports yet. Generate reports to see them here."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Reports are automatically deleted after 7 days. Download important
          reports to keep them permanently. Processing reports will appear here
          once generation is complete.
        </AlertDescription>
      </Alert>
    </div>
  );
}
