"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  getParseApiErrorMessage,
  readParseApiResponse,
} from "@/lib/utils/parse-api-response";

type SheetParseStatus = "pending" | "processing" | "done" | "failed";

interface SheetParseSelectorProps {
  projectId: string;
  fileId: string | null;
  sheetNames: string[];
  disabled?: boolean;
  disabledReason?: string;
}

function statusLabel(status: SheetParseStatus): string | null {
  switch (status) {
    case "processing":
      return "처리 중";
    case "done":
      return "완료";
    case "failed":
      return "실패";
    default:
      return null;
  }
}

export function SheetParseSelector({
  projectId,
  fileId,
  sheetNames,
  disabled = false,
  disabledReason,
}: SheetParseSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => {
    const init: Record<string, boolean> = {};
    for (const name of sheetNames) init[name] = false;
    return init;
  });
  const [statuses, setStatuses] = useState(() => {
    const init: Record<string, SheetParseStatus> = {};
    for (const name of sheetNames) init[name] = "pending";
    return init;
  });
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedNames = useMemo(
    () => sheetNames.filter((name) => selected[name]),
    [sheetNames, selected],
  );

  const toggleSheet = (name: string) => {
    if (parsing) return;
    setSelected((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const selectAll = () => {
    if (parsing) return;
    const next: Record<string, boolean> = {};
    for (const name of sheetNames) next[name] = true;
    setSelected(next);
  };

  const deselectAll = () => {
    if (parsing) return;
    const next: Record<string, boolean> = {};
    for (const name of sheetNames) next[name] = false;
    setSelected(next);
  };

  const handleParse = useCallback(async () => {
    if (!fileId || selectedNames.length === 0 || parsing || disabled) return;

    setParsing(true);
    setError(null);
    setSuccess(null);
    setFailures({});

    let totalRows = 0;
    let stopped = false;

    for (let i = 0; i < selectedNames.length; i++) {
      const sheetName = selectedNames[i];
      setStatuses((prev) => ({ ...prev, [sheetName]: "processing" }));

      try {
        const res = await fetch(`/api/projects/${projectId}/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId,
            sheetNames: [sheetName],
            replaceExisting: i === 0,
            append: i > 0,
          }),
        });

        const { data, ok } = await readParseApiResponse(res);

        if (!ok) {
          const message = getParseApiErrorMessage(
            data,
            `${sheetName} 파싱에 실패했습니다.`,
          );
          setStatuses((prev) => ({ ...prev, [sheetName]: "failed" }));
          setFailures((prev) => ({ ...prev, [sheetName]: message }));
          setError(message);
          stopped = true;
          break;
        }

        totalRows += typeof data.rowsExtracted === "number" ? data.rowsExtracted : 0;
        setStatuses((prev) => ({ ...prev, [sheetName]: "done" }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "파싱에 실패했습니다.";
        setStatuses((prev) => ({ ...prev, [sheetName]: "failed" }));
        setFailures((prev) => ({ ...prev, [sheetName]: message }));
        setError(message);
        stopped = true;
        break;
      }
    }

    if (!stopped) {
      setSuccess(`${selectedNames.length}개 시트 · ${totalRows}건 추출 완료`);
      router.refresh();
    }

    setParsing(false);
  }, [disabled, fileId, parsing, projectId, router, selectedNames]);

  const canParse =
    Boolean(fileId) && selectedNames.length > 0 && !parsing && !disabled;

  if (sheetNames.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-gray-900">시트 선택</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            파싱할 시트를 선택한 뒤 시작하세요 · 시트당 순차 처리
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={selectAll}
            disabled={parsing}
          >
            전체 선택
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={deselectAll}
            disabled={parsing}
          >
            전체 해제
          </Button>
        </div>
      </div>

      <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2">
        {sheetNames.map((name) => {
          const status = statuses[name] ?? "pending";
          const label = statusLabel(status);
          const isSelected = selected[name];

          return (
            <li
              key={name}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2",
                isSelected ? "bg-white ring-1 ring-blue-100" : "bg-transparent",
              )}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSheet(name)}
                  disabled={parsing}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate text-sm text-gray-800">{name}</span>
              </label>

              <div className="flex shrink-0 items-center gap-1">
                {status === "processing" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    {label}
                  </span>
                )}
                {status === "done" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    {label}
                  </span>
                )}
                {status === "failed" && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                    title={failures[name]}
                  >
                    <XCircle className="h-3 w-3" aria-hidden />
                    {label}
                  </span>
                )}
                {!isSelected && status === "pending" && (
                  <span className="text-xs text-gray-400">미선택</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-2">
        <Button
          type="button"
          onClick={handleParse}
          disabled={!canParse}
          className="h-9 w-full gap-2 sm:w-auto"
        >
          {parsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              AI 파싱 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              선택한 시트 AI 파싱 시작
            </>
          )}
        </Button>

        {!fileId && (
          <p className="text-xs text-amber-700">
            {disabledReason ?? "파일 업로드가 완료되면 파싱을 시작할 수 있습니다."}
          </p>
        )}
        {fileId && selectedNames.length === 0 && !parsing && (
          <p className="text-xs text-gray-500">
            파싱할 시트를 하나 이상 선택해 주세요.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && !parsing && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
