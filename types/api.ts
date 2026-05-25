/** API 오류 응답 (통일 형식) */
export interface ApiErrorResponse {
  error: string;
}

/** POST /api/projects/[id]/upload 성공 응답 */
export interface UploadResponse {
  fileId: string;
  fileName: string;
}

/** GET /api/projects/[id]/items 성공 응답 */
export interface ItemsListResponse {
  items: import("@/types/estimate-item").EstimateItem[];
}

/** POST /api/projects/[id]/parse 성공 응답 (일부 필드) */
export interface ParseResponse {
  rowsExtracted?: number;
  errors?: string[];
}
