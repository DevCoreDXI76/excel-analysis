import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 미들웨어 — Supabase Auth 세션 쿠키 갱신.
 * Phase 2에서 로그인 페이지 redirect는 여기에 추가합니다.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적 파일(_next/static, image, favicon 등)을 제외한 모든 경로
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
