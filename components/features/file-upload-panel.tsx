"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import type { MockProjectFile } from "@/lib/mock/projects";
import { cn } from "@/lib/utils/cn";

interface LocalFile {
  id: string;
  name: string;
  size: string;
}

interface FileUploadPanelProps {
  existingFiles: MockProjectFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadPanel({ existingFiles }: FileUploadPanelProps) {
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: formatFileSize(file.size),
    }));
    setLocalFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/csv": [".csv"],
    },
  });

  const removeLocalFile = (id: string) => {
    setLocalFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const allFiles = [
    ...existingFiles.map((f) => ({
      id: f.id,
      name: f.fileName,
      size: f.fileSize,
      sheets: f.sheets,
      isMock: true,
    })),
    ...localFiles.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      sheets: [] as string[],
      isMock: false,
    })),
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">파일 업로드</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          .xlsx, .csv · 프로젝트당 최대 10개 (Mock UI)
        </p>
      </div>

      <div className="flex-1 p-5">
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50",
          )}
        >
          <input {...getInputProps()} />
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
            공사내역서, 단가표, 장비 목록 등
          </p>
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            업로드된 파일 ({allFiles.length})
          </h3>
          {allFiles.length === 0 ? (
            <p className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-400">
              아직 업로드된 파일이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {allFiles.map((file) => (
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
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                    {file.sheets.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {file.sheets.map((sheet) => (
                          <span
                            key={sheet}
                            className="rounded bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200"
                          >
                            {sheet}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!file.isMock && (
                    <button
                      type="button"
                      onClick={() => removeLocalFile(file.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      aria-label={`${file.name} 제거`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
