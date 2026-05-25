/** AI 파싱 실행 상태 (DB parse_jobs.status) */
export type ParseJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/** AI 파싱 실행 이력 (DB parse_jobs) */
export interface ParseJob {
  id: string;
  projectId: string;
  fileId: string;
  status: ParseJobStatus;
  model: string | null;
  rowsExtracted: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}
