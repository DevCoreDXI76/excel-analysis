import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트.
 *
 * - anon key만 사용하며, RLS(행 수준 보안)로 데이터 접근을 제한합니다.
 * - `.env.local`에 아래 변수가 설정되어 있어야 합니다:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * @see docs/07_environment_setup_guide.md — Supabase 키 발급 방법
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인하세요. (docs/07_environment_setup_guide.md 참고)",
    );
  }

  return createBrowserClient(url, anonKey);
}
