/** 프로젝트 상태 (DB projects.status) */
export type ProjectStatus =
  | "draft"
  | "ready"
  | "analyzing"
  | "completed"
  | "failed";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  storagePath: string;
  fileSize: number | null;
  mimeType: string | null;
  sheetCount: number | null;
  uploadOrder: number;
  createdAt: string;
  sheets?: FileSheet[];
}

export interface FileSheet {
  id: string;
  fileId: string;
  sheetName: string;
  sheetIndex: number;
  rowCount: number | null;
  columnHeaders: string[];
  createdAt: string;
}

export interface ProjectWithFiles extends Project {
  files: ProjectFile[];
}

export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
}
