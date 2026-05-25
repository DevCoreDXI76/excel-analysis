import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 로그인 + 프로젝트 존재(RLS) 확인 */
export async function verifyProjectAccess(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      ),
    } as const;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    return {
      error: NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      ),
    } as const;
  }

  return { supabase, user, project } as const;
}

export function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return undefined;
  return num;
}
