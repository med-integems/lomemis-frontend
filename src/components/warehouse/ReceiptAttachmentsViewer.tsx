"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Download, Trash2, Loader2 } from "lucide-react";
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
import { stockReceiptApi } from "@/lib/api";

type Attachment = {
  id: number;
  receiptId: number;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  attachmentType: string;
  uploadedBy: number;
  uploadedAt: string;
  downloadUrl: string;
};

interface ReceiptAttachmentsViewerProps {
  receiptId: number;
  readOnly?: boolean;
  onChanged?: () => void;
}

export function ReceiptAttachmentsViewer({ receiptId, readOnly = false, onChanged }: ReceiptAttachmentsViewerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const res = await stockReceiptApi.getReceiptAttachments(receiptId);
      if (res.success) {
        setAttachments(res.data || []);
      }
    } catch (e) {
      toast.error("Failed to fetch attachments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [receiptId]);

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      setDownloadingId(attachment.id);
      // Build absolute URL to avoid double "/api" path with axios baseURL
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const href = attachment.downloadUrl.startsWith("http")
        ? attachment.downloadUrl
        : `${apiBase}${attachment.downloadUrl}`;

      const token = localStorage.getItem("auth_token");
      const resp = await fetch(href, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!resp.ok) {
        const text = await resp.text();
        let message = "Failed to download attachment";
        try {
          const data = JSON.parse(text);
          message = data?.error?.message || message;
        } catch {}
        toast.error(message);
        return;
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to download attachment");
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteAttachment = async (id: number) => {
    if (readOnly) return;
    try {
      setDeletingId(id);
      const res = await stockReceiptApi.deleteAttachment(id);
      if (res.success) {
        toast.success("Attachment deleted");
        setAttachments(prev => prev.filter(a => a.id !== id));
        if (onChanged) onChanged();
      } else {
        toast.error(res.error?.message || "Failed to delete attachment");
      }
    } catch (e) {
      toast.error("Failed to delete attachment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Attached Documents
          {attachments.length > 0 && (
            <Badge variant="secondary">{attachments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading attachments…</div>
        ) : attachments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No attachments yet.</div>
        ) : (
          <ul className="divide-y border rounded-md">
            {attachments.map(att => (
              <li key={att.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate" title={att.originalName}>{att.originalName}</div>
                  <div className="text-xs text-muted-foreground">
                    {att.attachmentType} • {(att.fileSize / 1024).toFixed(1)} KB • {new Date(att.uploadedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadAttachment(att)} disabled={downloadingId === att.id}>
                    {downloadingId === att.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="sr-only">Download</span>
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPendingDelete(att);
                        setConfirmOpen(true);
                      }}
                      disabled={deletingId === att.id}
                    >
                      {deletingId === att.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently removes the file record. The audit trail will record who deleted it and when. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-sm font-medium truncate">
            {pendingDelete?.originalName}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDelete) {
                  const id = pendingDelete.id;
                  setConfirmOpen(false);
                  await deleteAttachment(id);
                  setPendingDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default ReceiptAttachmentsViewer;
