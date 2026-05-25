"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import type { ProjectFile } from "@/types/project";
import { cn } from "@/lib/utils/cn";
import {
  getParseApiErrorMessage,
  readParseApiResponse,
} from "@/lib/utils/parse-api-response";

interface FileUploadPanelProps {
  projectId: string;
  files: ProjectFile[];
}

type PanelPhase = "idle" | "uploading" | "parsing";

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadPanel({ projectId, files }: FileUploadPanelProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<PanelPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setError(null);
      setSuccess(null);
      setPhase("uploading");

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch(`/api/projects/${projectId}/upload`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error ?? "업로드에 실패했습니다.");
          }

          if (typeof data.fileId === "string") {
            setPhase("parsing");
            setSuccess(null);

            const parseRes = await fetch(`/api/projects/${projectId}/parse`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileId: data.fileId }),
            });
            const { data: parseData, ok: parseOk } =
              await readParseApiResponse(parseRes);

            if (!parseOk) {
              throw new Error(
                getParseApiErrorMessage(
                  parseData,
                  `${file.name} AI 파싱에 실패했습니다. "AI 파싱" 버튼으로 재시도할 수 있습니다.`,
                ),
              );
            }

            setSuccess(
              `${file.name}: ${parseData.rowsExtracted ?? 0}건 추출 완료` +
                (Array.isArray(parseData.errors) && parseData.errors.length
                  ? ` (일부 오류 ${parseData.errors.length}건)`
                  : ""),
            );
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "업로드에 실패했습니다.",
          );
          break;
        }
      }

      setPhase("idle");
      router.refresh();
    },
    [projectId, router],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: phase !== "idle",
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/csv": [".csv"],
    },
  });

  const busy = phase !== "idle";

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">파일 업로드</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          .xlsx, .csv · 업로드 후 AI 자동 파싱
        </p>
      </div>

      <div className="flex-1 p-5">
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
            busy && "pointer-events-none opacity-60",
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50",
          )}
        >
          <input {...getInputProps()} />
          {phase === "uploading" ? (
            <>
              <Loader2
                className="mb-3 h-10 w-10 animate-spin text-blue-600"
                aria-hidden
              />
              <p className="text-sm font-medium text-gray-700">업로드 중...</p>
            </>
          ) : phase === "parsing" ? (
            <>
              <Sparkles
                className="mb-3 h-10 w-10 animate-pulse text-blue-600"
                aria-hidden
              />
              <p className="text-sm font-medium text-gray-700">AI 파싱 중...</p>
              <p className="mt-1 text-xs text-gray-500">
                최대 1~2분 소요될 수 있습니다
              </p>
            </>
          ) : (
            <>
              <Upload
                className={cn(
                  "mb-3 h-10 w-10",
                  isDragActive ? "text-blue-600" : "text-gray-400",
                )}
                aria-hidden
              />
              <p className="text-sm font-medium text-gray-700">
                {isDragActive
                  ? "여기에 파일을 놓으세요"
                  : "드래그 앤 드롭 또는 클릭하여 업로드"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                회의실 견적서 · 공사내역서 등
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && !busy && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            업로드된 파일 ({files.length})
          </h3>
          {files.length === 0 ? (
            <p className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-400">
              아직 업로드된 파일이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                >
                  <FileSpreadsheet
                    className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize)}
                      {file.parseStatus && (
                        <span className="ml-2 text-gray-400">
                          · {file.parseStatus}
                        </span>
                      )}
                    </p>
                    {file.sheets && file.sheets.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {file.sheets.map((sheet) => (
                          <span
                            key={sheet.id}
                            className="rounded bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200"
                          >
                            {sheet.sheetName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
