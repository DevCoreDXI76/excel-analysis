/** 분석 세션 상태 */
export type AnalysisStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/** DB analysis_sessions 테이블과 1:1 대응 */
export interface AnalysisSession {
  id: string;
  fileName: string;
  storagePath: string;
  status: AnalysisStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/** DB analysis_results 테이블과 1:1 대응 */
export interface AnalysisResult {
  id: string;
  sessionId: string;
  summary: string | null;
  chartUrls: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
}
