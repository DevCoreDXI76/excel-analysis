import * as XLSX from "xlsx";

/** AI 파싱 입력용 시트 데이터 */
export interface SheetDataForAI {
  sheetName: string;
  sheetIndex: number;
  columnHeaders: string[];
  rows: { rowIndex: number; values: string[] }[];
}

const MAX_ROWS_PER_SHEET = 100;

function isNonEmptyRow(values: string[]): boolean {
  return values.some((v) => v.trim().length > 0);
}

function extractFromWorkbook(workbook: XLSX.WorkBook): SheetDataForAI[] {
  return workbook.SheetNames.map((sheetName, sheetIndex) => {
    const sheet = workbook.Sheets[sheetName];
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

    return { sheetName, sheetIndex, columnHeaders, rows };
  }).filter((sheet) => sheet.rows.length > 0);
}

/** Storage 버퍼 → 시트별 행 JSON (xlsx / csv) */
export function extractSheetDataFromBuffer(
  buffer: ArrayBuffer,
  fileName: string,
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

    return [
      {
        sheetName: "Sheet1",
        sheetIndex: 0,
        columnHeaders,
        rows,
      },
    ];
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  return extractFromWorkbook(workbook);
}

/** OpenAI user 메시지용 compact JSON */
export function buildSheetPayloadForAI(
  sheets: SheetDataForAI[],
  fileName: string,
  projectName: string,
): string {
  return JSON.stringify(
    {
      project_name: projectName,
      file_name: fileName,
      note: `시트당 최대 ${MAX_ROWS_PER_SHEET}행까지 포함됩니다.`,
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

export { MAX_ROWS_PER_SHEET };
