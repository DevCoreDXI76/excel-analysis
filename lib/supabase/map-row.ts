import type {
  FileSheet,
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
