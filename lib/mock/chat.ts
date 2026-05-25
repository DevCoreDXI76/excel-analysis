/** Phase 4 전까지 AI 채팅 Mock (워크스페이스 UI용) */

export interface MockChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export const MOCK_CHAT_BY_PROJECT: Record<string, MockChatMessage[]> = {
  "1": [],
  "2": [],
  "3": [],
};

export const MOCK_AI_RESPONSES: Record<string, string> = {
  default:
    "요청하신 분석을 수행했습니다.\n\n• 업로드된 파일에서 메이커, 모델, 사양, 수량, 가격 컬럼을 탐지했습니다.\n• 파일 간 교차 비교 결과를 정리했습니다.\n\n(Phase 4에서 OpenAI API와 연동 예정)",
  summary:
    "공사내역서 요약:\n\n• 업로드된 파일의 주요 공종·금액을 집계했습니다.\n• 메이커별 비중과 주요 수치를 추출했습니다.\n\n(Phase 4에서 OpenAI API와 연동 예정)",
};

export function getMockAiResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("요약") || lower.includes("공사내역")) {
    return MOCK_AI_RESPONSES.summary;
  }
  return MOCK_AI_RESPONSES.default;
}
