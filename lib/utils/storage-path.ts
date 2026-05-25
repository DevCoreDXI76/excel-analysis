/**
 * Storage 객체 경로 생성.
 * 원본 파일명(한글·괄호 등)은 DB `file_name`에만 저장하고,
 * Storage 경로는 ASCII 안전 형식을 사용합니다.
 */
export function buildStoragePath(
  projectId: string,
  fileId: string,
  ext: string,
): string {
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${projectId}/${fileId}/file.${safeExt}`;
}

/** Supabase Storage 업로드 오류 → 사용자용 한글 메시지 */
export function mapStorageUploadError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("bucket not found") || lower.includes("bucket does not exist")) {
    return `Storage 버킷이 없습니다. Supabase Dashboard → Storage → 버킷 "project-files"(Private)를 생성해 주세요.`;
  }
  if (lower.includes("row-level security") || lower.includes("policy")) {
    return "Storage 접근 권한이 없습니다. Supabase Storage RLS 정책을 설정하거나 Vercel에 SUPABASE_SERVICE_ROLE_KEY를 추가해 주세요.";
  }
  if (lower.includes("payload too large") || lower.includes("entity too large")) {
    return "파일 크기가 Storage 허용 한도를 초과했습니다.";
  }
  if (lower.includes("invalid key") || lower.includes("invalid object")) {
    return "파일 경로가 유효하지 않습니다. 다시 시도해 주세요.";
  }
  if (lower.includes("already exists")) {
    return "동일한 파일이 이미 업로드되어 있습니다.";
  }

  return `파일 업로드에 실패했습니다. (${message})`;
}
