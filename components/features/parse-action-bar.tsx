"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getParseApiErrorMessage,
  readParseApiResponse,
} from "@/lib/utils/parse-api-response";

interface ParseActionBarProps {
  projectId: string;
  hasFiles: boolean;
  fileId?: string;
}

export function ParseActionBar({
  projectId,
  hasFiles,
  fileId,
}: ParseActionBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleParse = async () => {
    if (!hasFiles || loading) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fileId ? { fileId } : {}),
      });

      const { data, ok } = await readParseApiResponse(res);

      if (!ok) {
        throw new Error(
          getParseApiErrorMessage(data, "AI 파싱에 실패했습니다."),
        );
      }

      setSuccess(
        `${data.rowsExtracted ?? 0}건의 항목을 추출했습니다.` +
          (Array.isArray(data.errors) && data.errors.length
            ? ` (일부 파일 실패: ${data.errors.length}건)`
            : ""),
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "AI 파싱에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={handleParse}
          disabled={!hasFiles || loading}
          className="h-9 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              AI 파싱 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              AI 파싱
            </>
          )}
        </Button>
        <span className="text-xs text-gray-500">
          OpenAI Structured Output · 내역 시트 최대 8개 · 시트당 50행
        </span>
      </div>

      {loading && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          AI가 엑셀 데이터를 분석하고 있습니다. 최대 1~2분 소요될 수
          있습니다...
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && !loading && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}
    </div>
  );
}
