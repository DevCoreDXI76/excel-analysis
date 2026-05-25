import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Component 및 API Route에서 사용하는 Supabase 클라이언트.
 *
 * - 쿠키 기반 세션을 유지합니다 (Auth 로그인 시 활용).
 * - anon key + RLS로 사용자별 데이터를 보호합니다.
 *
 * @see docs/07_environment_setup_guide.md — 환경 변수 설정
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인하세요.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 set 호출 시 무시 (middleware에서 처리)
        }
      },
    },
  });
}

/**
 * API Route 전용 — Service Role Key로 RLS를 우회합니다.
 *
 * - Storage 업로드, 서버 측 DB 쓰기 등에만 사용하세요.
 * - SUPABASE_SERVICE_ROLE_KEY는 절대 클라이언트에 노출하지 마세요.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Service Role 환경 변수가 설정되지 않았습니다. .env.local을 확인하세요.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
