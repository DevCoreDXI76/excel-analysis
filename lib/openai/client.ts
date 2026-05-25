import OpenAI from "openai";

/**
 * OpenAI API 클라이언트 (서버 전용).
 * API Route 또는 lib/openai/* 에서만 import 하세요.
 */
export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env.local을 확인하세요.",
    );
  }

  return new OpenAI({ apiKey });
}
