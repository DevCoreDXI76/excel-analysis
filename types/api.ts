/** POST /api/upload 성공 응답 */
export interface UploadResponse {
  sessionId: string;
  fileName: string;
}

/** API 오류 응답 (통일 형식) */
export interface ApiErrorResponse {
  error: string;
}

/** POST /api/analyze 요청 본문 */
export interface AnalyzeRequest {
  sessionId: string;
}
