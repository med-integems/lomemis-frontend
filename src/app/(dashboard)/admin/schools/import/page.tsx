"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useSchoolImportUpload } from "@/hooks/useAdmin";
import { toast } from "sonner";

export default function SchoolImportPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [authoritative, setAuthoritative] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadMutation = useSchoolImportUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
      "application/csv" // .csv (alternative MIME type)
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file");
      return false;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 50MB");
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        options: { dryRun, authoritative }
      });

      if (result.success) {
        const importRunId = result.data.importRunId;
        toast.success("File uploaded successfully! Redirecting to import review...");
        router.push(`/admin/schools/import/${importRunId}`);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };


  return (
    <div className="container mx-auto py-6 space-y-6">
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
          <h1 className="text-3xl font-bold">School Data Import</h1>
          <p className="text-muted-foreground">
            Upload Excel files to import or update school information
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* File Upload Card */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload School Data
              </CardTitle>
              <CardDescription>
                Select an Excel (.xlsx, .xls) or CSV (.csv) file containing school information
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <div className="flex-1 space-y-4">
                {/* Drag and Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : selectedFile
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      {selectedFile ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <FileSpreadsheet className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium text-green-700">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">
                          Drag and drop your Excel or CSV file here, or{" "}
                          <label className="text-primary cursor-pointer hover:underline">
                            browse files
                            <Input
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </p>
                        <p className="text-xs text-gray-500">
                          Maximum file size: 50MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Import Options */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Import Mode</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dryRun"
                          checked={dryRun}
                          onCheckedChange={(checked) => {
                            setDryRun(!!checked);
                            if (checked) setAuthoritative(false);
                          }}
                        />
                        <Label htmlFor="dryRun" className="text-sm font-medium">
                          Dry Run (Preview Only)
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">
                        Validate and preview changes without applying them to the database
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="authoritative"
                          checked={authoritative}
                          onCheckedChange={(checked) => {
                            setAuthoritative(!!checked);
                            if (checked) setDryRun(false);
                          }}
                        />
                        <Label htmlFor="authoritative" className="text-sm font-medium">
                          Authoritative Import
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">
                        Apply changes directly to the database with this complete, authoritative list
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full mt-auto"
                size="lg"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload and Process
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          {/* Combined Requirements and Help Card */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">File Requirements</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">Required Columns</Badge>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• School Name</li>
                  <li>• EMIS Code</li>
                  <li>• Region</li>
                  <li>• District</li>
                  <li>• Council</li>
                  <li>• School Type</li>
                  <li>• Chiefdom</li>
                  <li>• Section</li>
                  <li>• Town</li>
                  <li>• Latitude</li>
                  <li>• Longitude</li>
                  <li>• Altitude</li>
                </ul>
              </div>

              {/* Help Section at Bottom */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Always run a dry run first to preview changes before committing to the database.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}