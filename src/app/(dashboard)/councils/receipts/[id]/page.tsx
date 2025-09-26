"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shipmentsApi, api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, Package, Truck, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function ShipmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [shipment, setShipment] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For downloads, use axios client with auth, not direct links

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [s, a] = await Promise.all([
          shipmentsApi.getShipmentById(id),
          shipmentsApi.getShipmentAttachments(id),
        ]);
        if (s.success) setShipment(s.data);
        else setError(s.error?.message || "Failed to load shipment");
        if (a.success) setAttachments(a.data || []);
      } catch (e) {
        setError("Failed to load shipment");
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isNaN(id)) load();
  }, [id]);

  const handleDownload = async (att: any) => {
    try {
      const path = (att.downloadUrl || '').replace(/^\/api/, '');
      const res = await api.get(path, { responseType: 'blob' });
      const disposition = (res.headers as any)['content-disposition'] || (res.headers as any)['Content-Disposition'];
      let filename = att.originalName || att.fileName || 'attachment';
      if (disposition) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
        const name = decodeURIComponent(match?.[1] || match?.[2] || filename);
        if (name) filename = name;
      }
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      const message = e?.response?.data?.error?.message || 'Failed to download attachment';
      toast.error(message);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const style =
      status === "IN_TRANSIT"
        ? "bg-blue-100 text-blue-800 border-blue-200"
        : status === "RECEIVED"
        ? "bg-green-100 text-green-800 border-green-200"
        : status === "DISCREPANCY"
        ? "bg-orange-100 text-orange-800 border-orange-200"
        : "";
    return <Badge className={style}>{status}</Badge>;
  };

  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm" className="inline-flex items-center gap-2">
          <Link href="/councils/receipts">
            <ArrowLeft className="h-4 w-4" /> Back to Receipts
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">{error}</div>
      ) : shipment ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Shipment {shipment.shipmentNumber}
                <StatusBadge status={shipment.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-muted-foreground text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> From Warehouse</div>
                  <div className="font-medium">{shipment.originWarehouseName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Dispatched</div>
                  <div className="font-medium">{shipment.dispatchDate ? formatDate(shipment.dispatchDate) : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Expected</div>
                  <div className="font-medium">{shipment.expectedArrivalDate ? formatDate(shipment.expectedArrivalDate) : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Actual</div>
                  <div className="font-medium">{shipment.actualArrivalDate ? formatDate(shipment.actualArrivalDate) : '-'}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2"><Package className="h-4 w-4" /> Items</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-2">Item</th>
                        <th className="py-2 px-2">Code</th>
                        <th className="py-2 px-2">Shipped</th>
                        <th className="py-2 px-2">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipment.items?.map((it: any) => (
                        <tr key={`${it.itemId}`} className="border-b">
                          <td className="py-2 px-2">{it.itemName}</td>
                          <td className="py-2 px-2">{it.itemCode}</td>
                          <td className="py-2 px-2">{it.quantityShipped}</td>
                          <td className="py-2 px-2">{it.quantityReceived ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No attachments uploaded</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-2">File</th>
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2">Size</th>
                        <th className="py-2 px-2">Uploaded</th>
                        <th className="py-2 px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attachments.map(att => (
                        <tr key={att.id} className="border-b">
                          <td className="py-2 px-2">{att.originalName || att.fileName}</td>
                          <td className="py-2 px-2">{att.attachmentType}</td>
                          <td className="py-2 px-2">{Math.round((att.fileSize || 0)/1024)} KB</td>
                          <td className="py-2 px-2">{att.uploadedAt ? new Date(att.uploadedAt).toLocaleString() : '-'}</td>
                          <td className="py-2 px-2">
                            <Button variant="outline" size="sm" className="inline-flex items-center gap-2" onClick={() => handleDownload(att)}>
                              <FileDown className="h-4 w-4" /> Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
