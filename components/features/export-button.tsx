"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  projectId: string;
  itemCount: number;
}

function parseFilenameFromDisposition(header: string | null): string | null {
  if (!header) return null;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      /* fall through */
    }
  }

  const asciiMatch = header.match(/filename="([^"]+)"/i);
  return asciiMatch?.[1] ?? null;
}

export function ExportButton({ projectId, itemCount }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (loading || itemCount === 0) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "엑셀 Export에 실패했습니다.");
      }

      const blob = await res.blob();
      const filename =
        parseFilenameFromDisposition(res.headers.get("Content-Disposition")) ??
        "export.xlsx";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "엑셀 Export에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleExport}
        disabled={itemCount === 0 || loading}
        className="h-9 gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Export 중...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" aria-hidden />
            엑셀 Export
          </>
        )}
      </Button>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
