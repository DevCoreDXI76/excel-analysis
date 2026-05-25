/** Supabase Storage 버킷 — docs/06_database_schema.md 기준 */
export const STORAGE_BUCKET_PROJECT_FILES = "project-files";

/** Dashboard → Storage → New bucket → project-files (Private) */
export const STORAGE_BUCKET_SETUP_HINT =
  "Supabase Dashboard → Storage → New bucket → 이름: project-files (Private)";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
] as const;
