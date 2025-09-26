"use client";

import { useMemo, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Upload, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QualityCheckPhotoUploadProps {
  maxPhotos?: number;
  acceptedTypes?: string[];
  value?: File[];
  onPhotosChange: (photos: File[]) => void;
  disabled?: boolean;
}

export function QualityCheckPhotoUpload({
  maxPhotos = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  value = [],
  onPhotosChange,
  disabled = false,
}: QualityCheckPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Combine with existing, respect max
    const combined = [...value, ...files].slice(0, maxPhotos);
    onPhotosChange(combined);
    // Clear the input so the same file can be selected again if needed
    if (inputRef.current) inputRef.current.value = "";
  };

  const previews = useMemo(
    () =>
      value.map((file) => ({
        name: file.name,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        url: URL.createObjectURL(file),
        type: file.type,
      })),
    [value]
  );

  const removeAt = (index: number) => {
    if (disabled) return;
    const next = value.slice();
    next.splice(index, 1);
    onPhotosChange(next);
  };

  return (
    <div>
      <Label className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4" /> Quality Check Photos
      </Label>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= maxPhotos}
          onClick={() => inputRef.current?.click()}
          className={cn(value.length >= maxPhotos && "opacity-60")}
        >
          <Upload className="w-4 h-4 mr-1" /> Select Photos
        </Button>
        <span className="text-xs text-muted-foreground">
          {value.length}/{maxPhotos} selected • Accepted: JPG, PNG, WEBP
        </span>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onPhotosChange([])}
            className="text-red-600 hover:text-red-700"
            title="Clear selected photos"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Preview grid */}
      <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {previews.map((p, idx) => (
          <div key={idx} className="relative group border rounded-md overflow-hidden bg-muted/30">
            <img
              src={p.url}
              alt={p.name}
              className="w-full h-24 object-cover"
              onLoad={() => URL.revokeObjectURL(p.url)}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 shadow hover:bg-white"
                aria-label={`Remove ${p.name}`}
                title="Remove"
              >
                <XCircle className="w-4 h-4 text-red-600" />
              </button>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-black/40 text-[10px] text-white px-1 py-0.5 truncate" title={p.name}>
              {p.name} • {p.sizeKb} KB
            </div>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          No photos selected.
        </div>
      )}
    </div>
  );
}

export default QualityCheckPhotoUpload;
