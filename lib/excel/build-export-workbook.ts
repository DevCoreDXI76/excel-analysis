import * as XLSX from "xlsx";
import type { EstimateItem } from "@/types/estimate-item";

const EXPORT_HEADERS = [
  "번호",
  "회의실명",
  "구분",
  "품명",
  "공급 제품",
  "제조사",
  "수량",
  "단위",
  "자재비 단가",
  "자재비 합계",
  "재료비 단가",
  "재료비 합계",
  "노무비 단가",
  "노무비 합계",
  "비고",
] as const;

const COLUMN_WIDTHS = [
  { wch: 6 },
  { wch: 14 },
  { wch: 10 },
  { wch: 22 },
  { wch: 18 },
  { wch: 12 },
  { wch: 8 },
  { wch: 6 },
  { wch: 12 },
  { wch: 12 },
  { wch: 12 },
  { wch: 12 },
  { wch: 12 },
  { wch: 12 },
  { wch: 16 },
];

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "프로젝트";
}

function formatExportDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function cellValue(value: number | null | undefined): number | string {
  return value ?? "";
}

function sumTotals(items: EstimateItem[], key: keyof EstimateItem): number {
  return items.reduce((acc, item) => {
    const val = item[key];
    return acc + (typeof val === "number" ? val : 0);
  }, 0);
}

/** `{프로젝트명}_Export_{YYYYMMDD}.xlsx` */
export function buildExportFilename(
  projectName: string,
  date = new Date(),
): string {
  const safeName = sanitizeFilenamePart(projectName);
  return `${safeName}_Export_${formatExportDate(date)}.xlsx`;
}

/** Content-Disposition 헤더 (한글 파일명 UTF-8) */
export function buildContentDisposition(filename: string): string {
  const asciiFallback =
    filename.replace(/[^\x20-\x7E]/g, "_") || "export.xlsx";
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/** DB 항목 → 회사 양식 xlsx 버퍼 */
export function buildExportWorkbookBuffer(
  projectName: string,
  items: EstimateItem[],
  exportedAt = new Date(),
): Buffer {
  const rows: (string | number)[][] = [
    ["견적·내역 Export"],
    ["프로젝트", projectName],
    ["Export 일시", exportedAt.toLocaleString("ko-KR")],
    [],
    [...EXPORT_HEADERS],
  ];

  items.forEach((item, index) => {
    rows.push([
      index + 1,
      item.roomName ?? "",
      item.category ?? "",
      item.itemName ?? "",
      item.suppliedProduct ?? "",
      item.manufacturer ?? "",
      cellValue(item.quantity),
      item.unit ?? "",
      cellValue(item.materialCostUnit),
      cellValue(item.materialCostTotal),
      cellValue(item.ingredientCostUnit),
      cellValue(item.ingredientCostTotal),
      cellValue(item.laborCostUnit),
      cellValue(item.laborCostTotal),
      item.remark ?? "",
    ]);
  });

  rows.push([]);
  rows.push([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "합계",
    "",
    sumTotals(items, "materialCostTotal"),
    "",
    sumTotals(items, "ingredientCostTotal"),
    "",
    sumTotals(items, "laborCostTotal"),
    "",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = COLUMN_WIDTHS;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "내역");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
