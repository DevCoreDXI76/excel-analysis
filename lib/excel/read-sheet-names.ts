import * as XLSX from "xlsx";

/** 브라우저 File → 시트명 목록 (전체 행 파싱 없음) */
export async function readSheetNamesFromFile(file: File): Promise<string[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    return ["Sheet1"];
  }

  if (ext !== "xlsx") {
    throw new Error(".xlsx 또는 .csv 파일만 지원합니다.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", bookSheets: true });
  return workbook.SheetNames ?? [];
}

/** ArrayBuffer + 파일명 → 시트명 목록 (서버용) */
export function readSheetNamesFromBuffer(
  buffer: ArrayBuffer,
  fileName: string,
): string[] {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    return ["Sheet1"];
  }

  const workbook = XLSX.read(buffer, { type: "array", bookSheets: true });
  return workbook.SheetNames ?? [];
}
