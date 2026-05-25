import * as XLSX from "xlsx";

/** AI 파싱 입력용 시트 데이터 */
export interface SheetDataForAI {
  sheetName: string;
  sheetIndex: number;
  columnHeaders: string[];
  rows: { rowIndex: number; values: string[] }[];
}

export interface ExtractSheetOptions {
  /** 지정 시 해당 시트만 추출 (자동 필터/8개 제한 미적용) */
  sheetNames?: string[];
}

/** 시트당 AI에 전달할 최대 행 수 (타임아웃 방지) */
const MAX_ROWS_PER_SHEET = 50;

/** 한 파일에서 파싱할 최대 시트 수 (자동 모드) */
const MAX_SHEETS_TO_PARSE = 8;

/** 요약·집계 시트 — 파싱 대상에서 제외 (자동 모드) */
const SKIP_SHEET_NAME_PATTERNS: RegExp[] = [
  /^원가계산서$/i,
  /^총괄표$/i,
  /^표지$/i,
  /^cover$/i,
  /^summary$/i,
  /^목차$/i,
  /^index$/i,
  /^sheet\d+$/i,
  /^시트\d+$/i,
];

function isNonEmptyRow(values: string[]): boolean {
  return values.some((v) => v.trim().length > 0);
}

function shouldSkipSheet(sheetName: string): boolean {
  const name = sheetName.trim();
  return SKIP_SHEET_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

/** 요약 시트 제외 + 최대 시트 수 제한 (자동 모드) */
export function filterSheetsForParsing(
  sheets: SheetDataForAI[],
): SheetDataForAI[] {
  const detailSheets = sheets.filter((s) => !shouldSkipSheet(s.sheetName));
  const candidates = detailSheets.length > 0 ? detailSheets : sheets;
  return candidates.slice(0, MAX_SHEETS_TO_PARSE);
}

function extractSheetFromWorkbook(
  workbook: XLSX.WorkBook,
  sheetName: string,
  sheetIndex: number,
): SheetDataForAI | null {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;

  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
  }) as string[][];

  const headerRow = rawRows[0] ?? [];
  const columnHeaders = headerRow
    .map((cell) => String(cell ?? "").trim())
    .filter(Boolean);

  const rows = rawRows
    .slice(1)
    .map((cells, idx) => ({
      rowIndex: idx + 2,
      values: cells.map((cell) => String(cell ?? "").trim()),
    }))
    .filter((row) => isNonEmptyRow(row.values))
    .slice(0, MAX_ROWS_PER_SHEET);

  if (rows.length === 0) return null;

  return { sheetName, sheetIndex, columnHeaders, rows };
}

function extractFromWorkbook(
  workbook: XLSX.WorkBook,
  options?: ExtractSheetOptions,
): SheetDataForAI[] {
  const targetNames = options?.sheetNames?.map((n) => n.trim()).filter(Boolean);

  if (targetNames && targetNames.length > 0) {
    const nameSet = new Set(targetNames);
    const sheets: SheetDataForAI[] = [];

    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      if (!nameSet.has(sheetName)) continue;

      const extracted = extractSheetFromWorkbook(workbook, sheetName, i);
      if (extracted) sheets.push(extracted);
    }

    return sheets;
  }

  const allSheets = workbook.SheetNames.map((sheetName, sheetIndex) =>
    extractSheetFromWorkbook(workbook, sheetName, sheetIndex),
  ).filter((s): s is SheetDataForAI => s != null);

  return filterSheetsForParsing(allSheets);
}

/** Storage 버퍼 → 시트별 행 JSON (xlsx / csv) */
export function extractSheetDataFromBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  options?: ExtractSheetOptions,
): SheetDataForAI[] {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    const headerLine = lines[0] ?? "";
    const columnHeaders = headerLine
      .split(",")
      .map((cell) => cell.trim())
      .filter(Boolean);
    const rows = lines
      .slice(1)
      .map((line, idx) => ({
        rowIndex: idx + 2,
        values: line.split(",").map((cell) => cell.trim()),
      }))
      .filter((row) => isNonEmptyRow(row.values))
      .slice(0, MAX_ROWS_PER_SHEET);

    const sheet: SheetDataForAI = {
      sheetName: "Sheet1",
      sheetIndex: 0,
      columnHeaders,
      rows,
    };

    if (options?.sheetNames?.length) {
      const allowed = new Set(options.sheetNames);
      return allowed.has("Sheet1") && rows.length > 0 ? [sheet] : [];
    }

    return rows.length > 0 ? [sheet] : [];
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  return extractFromWorkbook(workbook, options);
}

/** OpenAI user 메시지용 compact JSON */
export function buildSheetPayloadForAI(
  sheets: SheetDataForAI[],
  fileName: string,
  projectName: string,
): string {
  const note =
    sheets.length === 1
      ? `선택 시트 1개 · 시트당 최대 ${MAX_ROWS_PER_SHEET}행`
      : `내역 시트 · 시트당 최대 ${MAX_ROWS_PER_SHEET}행 · 최대 ${MAX_SHEETS_TO_PARSE}개 시트`;

  return JSON.stringify(
    {
      project_name: projectName,
      file_name: fileName,
      note,
      sheets: sheets.map((s) => ({
        sheet_name: s.sheetName,
        column_headers: s.columnHeaders,
        rows: s.rows.map((r) => ({
          source_row_index: r.rowIndex,
          cells: r.values,
        })),
      })),
    },
    null,
    2,
  );
}

export { MAX_ROWS_PER_SHEET, MAX_SHEETS_TO_PARSE };
