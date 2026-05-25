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

/** POST /api/projects/[id]/parse 요청 body */
export interface ParseRequest {
  fileId?: string;
  sheetNames?: string[];
  replaceExisting?: boolean;
  append?: boolean;
}

/** POST /api/projects/[id]/parse 성공 응답 */
export interface ParseResponse {
  rowsExtracted?: number;
  sheetName?: string;
  sheetNames?: string[];
  fileId?: string;
  filesParsed?: number;
  errors?: string[];
}
