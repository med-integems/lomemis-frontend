"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { StandardReports } from "./standard-reports";
import { CustomReportBuilder, type CustomQuery } from "./custom-report-builder";
// import { ReportExport, type ExportJob } from "./report-export"; // Disabled for now
type ExportJob = { id: string; status: string; }; // Temporary type
import { ReportGenerator } from "./report-generator";
import { ReportPreview } from "./report-preview";

import { reportsApi } from "@/lib/api";

interface ReportsContainerProps {
  userRole?: string;
}

type ReportPreviewData = {
  data: unknown[];
  metadata: {
    generatedAt: string;
    recordCount: number;
    reportType: string;
    filters: Record<string, unknown>;
    executionTime: number;
  };
  charts?: unknown[];
};

export function ReportsContainer({ userRole }: ReportsContainerProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("generator");
  const [generatingReport, setGeneratingReport] = useState<string | undefined>(
    undefined
  );
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<unknown[] | undefined>(
    undefined
  );
  const [reportPreviewData, setReportPreviewData] = useState<
    ReportPreviewData | undefined
  >(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | undefined>(
    undefined
  );

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: "1",
      reportName: "Shipment History Report",
      format: "excel",
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      fileSize: "2.3 MB",
      downloadUrl: "/api/reports/exports/report-1.xlsx",
    },
  ]);

  // Generate a template report (server handles CSV/XLSX)
  const generateReportMutation = useMutation({
    mutationFn: (reportId: string) =>
      reportsApi.generateTemplateReport(reportId, {
        exportFormat: "csv",
        includeCharts: true,
      }),
    onMutate: (reportId: string) => setGeneratingReport(reportId),
    onSuccess: () => {
      toast.success("Report generated successfully");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("Report generation failed:", message);
      toast.error("Failed to generate report");
    },
    onSettled: () => setGeneratingReport(undefined),
  });

  // Download a previously generated export by filename
  const downloadReportMutation = useMutation({
    mutationFn: (filename: string) => reportsApi.downloadExport(filename),
    onSuccess: (blob, filename) => {
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename as string;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to download report: ${message}`);
    },
  });

  // Execute custom query
  const executeQueryMutation = useMutation({
    mutationFn: (query: CustomQuery) => reportsApi.executeCustomQuery(query),
    onMutate: () => {
      setExecutingQuery(true);
      setQueryResult(undefined);
    },
    onSuccess: (res) => {
      setQueryResult(res.data?.data || []);
      toast.success(
        `Query executed successfully. ${
          res.data?.data?.length || 0
        } rows returned.`
      );
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to execute query: ${message}`);
    },
    onSettled: () => setExecutingQuery(false),
  });

  // Save custom query
  const saveQueryMutation = useMutation({
    mutationFn: (query: CustomQuery) => reportsApi.saveCustomQuery(query),
    onSuccess: () => {
      toast.success("Custom query saved successfully");
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to save query: ${message}`);
    },
  });

  // Start an export job (CSV or Excel)
  const exportReportMutation = useMutation({
    mutationFn: ({
      reportId,
      format,
    }: {
      reportId: string;
      format: "excel" | "csv";
    }) => reportsApi.exportReport(reportId, format),
    onSuccess: (data, variables) => {
      const newJob: ExportJob = {
        id: data.data?.jobId || Date.now().toString(),
        reportName: variables.reportId
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        format: variables.format,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setExportJobs((prev) => [newJob, ...prev]);
      toast.success("Export job started successfully");

      // Simulate completion for demo purposes
      setTimeout(() => {
        setExportJobs((prev) =>
          prev.map((job) =>
            job.id === newJob.id
              ? {
                  ...job,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                  fileSize: "1.5 MB",
                  downloadUrl: `/api/reports/exports/report-${newJob.id}.${
                    variables.format === "csv" ? "csv" : "xlsx"
                  }`,
                }
              : job
          )
        );
        toast.success(`Export completed: ${newJob.reportName}`);
      }, 3000);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to start export: ${message}`);
    },
  });

  const handleGenerateReport = (reportId: string) =>
    generateReportMutation.mutate(reportId);

  const handleDownloadReport = (reportId: string) => {
    // Simulate filename from a generated report (prefer CSV)
    const filename = `${reportId}-report.csv`;
    downloadReportMutation.mutate(filename);
  };

  const handleExecuteQuery = (query: CustomQuery) =>
    executeQueryMutation.mutate(query);
  const handleSaveQuery = (query: CustomQuery) =>
    saveQueryMutation.mutate(query);

  const handleExportReport = (reportId: string, format: "excel" | "csv") => {
    exportReportMutation.mutate({ reportId, format });
  };

  const handleDownloadExport = async (jobId: string) => {
    const job = exportJobs.find((j) => j.id === jobId);
    const downloadUrl = job?.downloadUrl;
    if (!downloadUrl) return toast.error("No download URL available");

    try {
      const parts = downloadUrl.split("/").filter(Boolean);
      let filename = parts.reverse().find((p) => /\.[a-zA-Z0-9]+$/.test(p));
      if (!filename && job)
        filename = `${job.reportName.toLowerCase().replace(/\s+/g, "-")}.${
          job.format === "csv" ? "csv" : "xlsx"
        }`;
      filename = decodeURIComponent(filename || "report.bin");

      const blob = await reportsApi.downloadExport(filename);
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download file");
    }
  };

  const handleRetryExport = (jobId: string) => {
    setExportJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "pending", error: undefined } : job
      )
    );
    // In a real app, you'd call the API to retry the job. Here we simulate completion.
    setTimeout(() => {
      setExportJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: "completed",
                completedAt: new Date().toISOString(),
                fileSize: "1.2 MB",
                downloadUrl: "/api/reports/exports/report-1.csv",
              }
            : job
        )
      );
      toast.success("Export retried and completed");
    }, 2000);
  };

  return (
    <div>
      {(generateReportMutation.isError ||
        executeQueryMutation.isError ||
        saveQueryMutation.isError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An error occurred while processing your request. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generator">Report Generator</TabsTrigger>
          <TabsTrigger value="standard">Standard Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="export">Export & Download</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <ReportGenerator
            userRole={userRole}
            onGenerate={(config) => {
              setReportPreviewData(undefined);
              setPreviewError(undefined);
              generateReportMutation.mutate(config.type);
            }}
            onPreview={(config) => {
              setPreviewLoading(true);
              setPreviewError(undefined);
              // Simulate preview
              setTimeout(() => {
                setReportPreviewData({
                  data: [
                    {
                      item_name: "Sample Item 1",
                      category: "Textbooks",
                      stock: 150,
                    },
                    {
                      item_name: "Sample Item 2",
                      category: "Exercise Books",
                      stock: 75,
                    },
                  ],
                  metadata: {
                    generatedAt: new Date().toISOString(),
                    recordCount: 2,
                    reportType: config.type,
                    filters: config.filters || {},
                    executionTime: 1250,
                  },
                });
                setPreviewLoading(false);
                setActiveTab("preview");
              }, 1200);
            }}
          />
        </TabsContent>

        <TabsContent value="standard" className="space-y-6">
          <StandardReports
            userRole={userRole}
            onGenerateReport={handleGenerateReport}
            onDownloadReport={handleDownloadReport}
            onPreviewData={(r) => {
              setReportPreviewData(r);
              setActiveTab("preview");
            }}
            isGenerating={generatingReport}
          />
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <CustomReportBuilder
            userRole={userRole}
            onExecuteQuery={handleExecuteQuery}
            onSaveQuery={handleSaveQuery}
            isExecuting={executingQuery}
            queryResult={queryResult}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <ReportPreview
            reportData={reportPreviewData}
            isLoading={previewLoading}
            error={previewError}
            onRegenerateWithExport={(format) => {
              if (!reportPreviewData) return;
              const type = reportPreviewData.metadata.reportType;
              // Always use CSV path for regenerating previews
              if (format === "csv") {
                handleExportReport(type, "csv");
              } else {
                handleExportReport(type, "excel");
              }
            }}
          />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          {/* ReportExport component disabled for now */}
          <div className="text-center py-8 text-muted-foreground">
            Export functionality temporarily disabled
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
