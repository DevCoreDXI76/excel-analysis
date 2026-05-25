"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { SheetParseSelector } from "@/components/features/sheet-parse-selector";
import type { ProjectFile } from "@/types/project";
import { readSheetNamesFromFile } from "@/lib/excel/read-sheet-names";
import { cn } from "@/lib/utils/cn";

interface FileUploadPanelProps {
  projectId: string;
  files: ProjectFile[];
}

type UploadPhase = "idle" | "reading" | "uploading";

interface PendingUpload {
  fileName: string;
  sheetNames: string[];
  fileId: string | null;
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadPanel({ projectId, files }: FileUploadPanelProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(
    null,
  );
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const selectedFile = useMemo(
    () => files.find((f) => f.id === selectedFileId) ?? null,
    [files, selectedFileId],
  );

  const activeSheetNames = useMemo(() => {
    if (pendingUpload) return pendingUpload.sheetNames;
    if (selectedFile?.sheets?.length) {
      return selectedFile.sheets.map((s) => s.sheetName);
    }
    return [];
  }, [pendingUpload, selectedFile]);

  const activeFileId = pendingUpload?.fileId ?? selectedFileId;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setError(null);
      setSelectedFileId(null);
      setPhase("reading");

      try {
        const sheetNames = await readSheetNamesFromFile(file);
        setPendingUpload({
          fileName: file.name,
          sheetNames,
          fileId: null,
        });
        setPhase("uploading");

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/projects/${projectId}/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "업로드에 실패했습니다.");
        }

        if (typeof data.fileId !== "string") {
          throw new Error("업로드 응답에 fileId가 없습니다.");
        }

        setPendingUpload({
          fileName: file.name,
          sheetNames,
          fileId: data.fileId,
        });
        setSelectedFileId(data.fileId);
        router.refresh();
      } catch (err) {
        setPendingUpload(null);
        setError(
          err instanceof Error ? err.message : "업로드에 실패했습니다.",
        );
      } finally {
        setPhase("idle");
      }
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
    multiple: false,
  });

  const busy = phase !== "idle";

  const handleSelectFile = (file: ProjectFile) => {
    if (busy) return;
    setPendingUpload(null);
    setSelectedFileId(file.id);
    setError(null);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">파일 업로드</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          .xlsx, .csv · 업로드 후 시트를 선택해 AI 파싱
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
          {phase === "reading" ? (
            <>
              <Loader2
                className="mb-3 h-10 w-10 animate-spin text-blue-600"
                aria-hidden
              />
              <p className="text-sm font-medium text-gray-700">
                시트 목록 읽는 중...
              </p>
            </>
          ) : phase === "uploading" ? (
            <>
              <Loader2
                className="mb-3 h-10 w-10 animate-spin text-blue-600"
                aria-hidden
              />
              <p className="text-sm font-medium text-gray-700">업로드 중...</p>
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

        {activeSheetNames.length > 0 && (
          <SheetParseSelector
            key={`${activeFileId ?? "pending"}-${activeSheetNames.join("\u0001")}`}
            projectId={projectId}
            fileId={activeFileId}
            sheetNames={activeSheetNames}
            disabled={phase === "uploading" || !activeFileId}
            disabledReason={
              phase === "uploading"
                ? "업로드가 완료되면 파싱을 시작할 수 있습니다."
                : undefined
            }
          />
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
              {files.map((file) => {
                const isSelected =
                  selectedFileId === file.id ||
                  pendingUpload?.fileId === file.id;

                return (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectFile(file)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                        isSelected
                          ? "border-blue-200 bg-blue-50/60"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100/80",
                      )}
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
                          <p className="mt-1 text-xs text-gray-400">
                            {file.sheets.length}개 시트 · 클릭하여 재파싱
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
