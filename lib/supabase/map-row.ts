import type { EstimateItem } from "@/types/estimate-item";
import type { ParseJob, ParseJobStatus } from "@/types/parse-job";
import type {
  FileSheet,
  ParseStatus,
  Project,
  ProjectFile,
  ProjectStatus,
} from "@/types/project";

/** DB projects 행 → Project */
export function mapProjectRow(
  row: Record<string, unknown>,
  fileCount = 0,
): Project {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    status: row.status as ProjectStatus,
    fileCount,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** DB project_files 행 → ProjectFile */
export function mapProjectFileRow(
  row: Record<string, unknown>,
  sheets?: FileSheet[],
): ProjectFile {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    fileName: row.file_name as string,
    storagePath: row.storage_path as string,
    fileSize: (row.file_size as number | null) ?? null,
    mimeType: (row.mime_type as string | null) ?? null,
    sheetCount: (row.sheet_count as number | null) ?? null,
    parseStatus: (row.parse_status as ParseStatus) ?? "pending",
    uploadOrder: row.upload_order as number,
    createdAt: row.created_at as string,
    sheets,
  };
}

/** DB file_sheets 행 → FileSheet */
export function mapFileSheetRow(row: Record<string, unknown>): FileSheet {
  return {
    id: row.id as string,
    fileId: row.file_id as string,
    sheetName: row.sheet_name as string,
    sheetIndex: row.sheet_index as number,
    rowCount: (row.row_count as number | null) ?? null,
    columnHeaders: (row.column_headers as string[]) ?? [],
    createdAt: row.created_at as string,
  };
}

/** DB estimate_items 행 → EstimateItem */
export function mapEstimateItemRow(
  row: Record<string, unknown>,
): EstimateItem {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    fileId: row.file_id as string,
    sheetName: row.sheet_name as string,
    sourceRowIndex: (row.source_row_index as number | null) ?? null,
    roomName: (row.room_name as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    itemName: (row.item_name as string | null) ?? null,
    suppliedProduct: (row.supplied_product as string | null) ?? null,
    specification: (row.specification as string | null) ?? null,
    manufacturer: (row.manufacturer as string | null) ?? null,
    quantity: row.quantity != null ? Number(row.quantity) : null,
    unit: (row.unit as string | null) ?? null,
    materialCostUnit:
      row.material_cost_unit != null ? Number(row.material_cost_unit) : null,
    materialCostTotal:
      row.material_cost_total != null ? Number(row.material_cost_total) : null,
    ingredientCostUnit:
      row.ingredient_cost_unit != null
        ? Number(row.ingredient_cost_unit)
        : null,
    ingredientCostTotal:
      row.ingredient_cost_total != null
        ? Number(row.ingredient_cost_total)
        : null,
    laborCostUnit:
      row.labor_cost_unit != null ? Number(row.labor_cost_unit) : null,
    laborCostTotal:
      row.labor_cost_total != null ? Number(row.labor_cost_total) : null,
    unitPrice: row.unit_price != null ? Number(row.unit_price) : null,
    totalAmount: row.total_amount != null ? Number(row.total_amount) : null,
    remark: (row.remark as string | null) ?? null,
    extraFields: (row.extra_fields as Record<string, unknown>) ?? {},
    isManuallyEdited: Boolean(row.is_manually_edited),
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** DB parse_jobs 행 → ParseJob */
export function mapParseJobRow(row: Record<string, unknown>): ParseJob {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    fileId: row.file_id as string,
    status: row.status as ParseJobStatus,
    model: (row.model as string | null) ?? null,
    rowsExtracted: (row.rows_extracted as number | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}
