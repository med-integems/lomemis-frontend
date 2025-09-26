// Downloads management utility

export interface DownloadableReport {
  id: string;
  name: string;
  type: string;
  format: "excel" | "csv";
  status: "completed" | "processing" | "failed" | "expired";
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  fileSize?: string;
  downloadUrl?: string;
  error?: string;
  recordCount?: number;
  generatedBy: string;
}

export const addDownload = (
  download: Omit<DownloadableReport, "id" | "createdAt">
) => {
  if (typeof window === "undefined") return;

  const newDownload: DownloadableReport = {
    ...download,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  const existing = getDownloads();
  const updated = [newDownload, ...existing.slice(0, 19)]; // Keep only 20 most recent

  localStorage.setItem("lomemis-downloads", JSON.stringify(updated));

  // Dispatch custom event to notify components
  window.dispatchEvent(
    new CustomEvent("downloads-updated", { detail: updated })
  );

  return newDownload;
};

export const getDownloads = (): DownloadableReport[] => {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem("lomemis-downloads");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored downloads:", e);
      return [];
    }
  }

  return [];
};

export const updateDownload = (
  id: string,
  updates: Partial<DownloadableReport>
) => {
  if (typeof window === "undefined") return;

  const existing = getDownloads();
  const updated = existing.map((download) =>
    download.id === id ? { ...download, ...updates } : download
  );

  localStorage.setItem("lomemis-downloads", JSON.stringify(updated));
  window.dispatchEvent(
    new CustomEvent("downloads-updated", { detail: updated })
  );
};

export const removeDownload = (id: string) => {
  if (typeof window === "undefined") return;

  const existing = getDownloads();
  const updated = existing.filter((download) => download.id !== id);

  localStorage.setItem("lomemis-downloads", JSON.stringify(updated));
  window.dispatchEvent(
    new CustomEvent("downloads-updated", { detail: updated })
  );
};
