/** 프로젝트 상태 (06_database_schema.md 기준) */
export type ProjectStatus =
  | "draft"
  | "ready"
  | "analyzing"
  | "completed"
  | "failed";

export interface MockProject {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  fileCount: number;
  updatedAt: string;
}

export interface MockProjectFile {
  id: string;
  fileName: string;
  fileSize: string;
  sheets: string[];
}

export interface MockChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "1",
    name: "OO공사 2025 견적 검토",
    description: "토목·전기 공사내역서 및 장비 단가표 종합 분석",
    status: "completed",
    fileCount: 3,
    updatedAt: "2025-05-20",
  },
  {
    id: "2",
    name: "XX 프로젝트 입찰",
    description: "메이커별 단가 비교 및 수량·가격 교차 검토",
    status: "ready",
    fileCount: 2,
    updatedAt: "2025-05-22",
  },
  {
    id: "3",
    name: "YY설비 교체 공사",
    description: "장비 모델·사양 불일치 탐지 및 내역 정합성 확인",
    status: "analyzing",
    fileCount: 4,
    updatedAt: "2025-05-23",
  },
  {
    id: "4",
    name: "신규 견적 초안",
    description: "업로드 대기 중인 신규 프로젝트",
    status: "draft",
    fileCount: 0,
    updatedAt: "2025-05-24",
  },
];

export const MOCK_FILES_BY_PROJECT: Record<string, MockProjectFile[]> = {
  "1": [
    {
      id: "f1",
      fileName: "공사내역서_토목.xlsx",
      fileSize: "2.4 MB",
      sheets: ["토목", "전기"],
    },
    {
      id: "f2",
      fileName: "공사내역서_전기.xlsx",
      fileSize: "1.8 MB",
      sheets: ["Summary", "내역"],
    },
    {
      id: "f3",
      fileName: "단가표_메이커별.xlsx",
      fileSize: "980 KB",
      sheets: ["A사", "B사", "C사"],
    },
  ],
  "2": [
    {
      id: "f4",
      fileName: "입찰_내역서.xlsx",
      fileSize: "3.1 MB",
      sheets: ["공종별", "장비목록"],
    },
    {
      id: "f5",
      fileName: "단가_비교.csv",
      fileSize: "420 KB",
      sheets: ["Sheet1"],
    },
  ],
  "3": [
    {
      id: "f6",
      fileName: "설비_교체_내역.xlsx",
      fileSize: "1.5 MB",
      sheets: ["Pump", "Valve", "Pipe"],
    },
    {
      id: "f7",
      fileName: "사양서_비교.xlsx",
      fileSize: "890 KB",
      sheets: ["Model_A", "Model_B"],
    },
    {
      id: "f8",
      fileName: "견적_요약.csv",
      fileSize: "210 KB",
      sheets: ["Sheet1"],
    },
    {
      id: "f9",
      fileName: "메이커_단가표.xlsx",
      fileSize: "1.2 MB",
      sheets: ["Samsung", "LG", "Hyundai"],
    },
  ],
  "4": [],
};

export const MOCK_CHAT_BY_PROJECT: Record<string, MockChatMessage[]> = {
  "1": [
    {
      id: "m1",
      role: "assistant",
      content:
        "OO공사 2025 견적 프로젝트 분석이 완료되었습니다.\n\n• 전체 장비 금액 합계: 약 4.2억 원\n• A사와 B사 동일 모델 단가 차이: 12%\n• 공사내역서 B에만 존재하는 항목: 3건\n\n자세한 교차 분석은 리포트 탭에서 확인하세요.",
      createdAt: "2025-05-20 14:32",
    },
  ],
  "2": [],
  "3": [
    {
      id: "m2",
      role: "user",
      content: "Pump 시트와 Valve 시트의 모델명 불일치 항목을 찾아줘",
      createdAt: "2025-05-23 10:15",
    },
    {
      id: "m3",
      role: "assistant",
      content:
        "분석 중입니다. Pump 시트의 XX-100 모델과 Valve 시트의 XX-100A가 불일치 후보로 탐지되었습니다. 완료 후 상세 리포트를 제공합니다.",
      createdAt: "2025-05-23 10:16",
    },
  ],
  "4": [],
};

/** Mock AI 응답 — 채팅 전송 시 사용 */
export const MOCK_AI_RESPONSES: Record<string, string> = {
  default:
    "요청하신 분석을 수행했습니다.\n\n• 업로드된 파일에서 메이커, 모델, 사양, 수량, 가격 컬럼을 탐지했습니다.\n• 파일 간 교차 비교 결과, 주요 불일치 2건과 이상치 1건을 확인했습니다.\n• 상세 차트는 분석 완료 후 표시됩니다. (Mock 응답)",
  summary:
    "공사내역서 요약:\n\n• 총 3개 파일, 8개 시트 분석\n• 공종별 금액: 토목 1.8억 / 전기 1.2억 / 장비 1.2억\n• 메이커별 비중: A사 45%, B사 35%, C사 20%\n\n( Mock 데이터 기반 샘플 응답 )",
};

export function getProjectById(id: string): MockProject | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}

export function getRecentProjects(limit = 3): MockProject[] {
  return [...MOCK_PROJECTS]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export function getDashboardStats() {
  return {
    total: MOCK_PROJECTS.length,
    completed: MOCK_PROJECTS.filter((p) => p.status === "completed").length,
    inProgress: MOCK_PROJECTS.filter(
      (p) => p.status === "analyzing" || p.status === "ready",
    ).length,
  };
}

export function getMockAiResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("요약") || lower.includes("공사내역")) {
    return MOCK_AI_RESPONSES.summary;
  }
  return MOCK_AI_RESPONSES.default;
}
