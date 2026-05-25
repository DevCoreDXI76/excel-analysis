import { createClient } from "@/lib/supabase/server";
import {
  mapFileSheetRow,
  mapProjectFileRow,
  mapProjectRow,
} from "@/lib/supabase/map-row";
import type {
  DashboardStats,
  Project,
  ProjectWithFiles,
} from "@/types/project";

/** 로그인 사용자의 프로젝트 목록 (RLS 적용) */
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*, project_files(count)")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getProjects]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const files = row.project_files as { count: number }[] | null;
    const fileCount = files?.[0]?.count ?? 0;
    return mapProjectRow(row as Record<string, unknown>, fileCount);
  });
}

/** 프로젝트 단건 + 파일·시트 (RLS) */
export async function getProjectById(
  id: string,
): Promise<ProjectWithFiles | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_files (
        *,
        file_sheets (*)
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[getProjectById]", error.message);
    return null;
  }

  const rawFiles = (data.project_files ?? []) as Record<string, unknown>[];
  const files = rawFiles.map((f) => {
    const rawSheets = (f.file_sheets ?? []) as Record<string, unknown>[];
    const sheets = rawSheets.map(mapFileSheetRow);
    return mapProjectFileRow(f, sheets);
  });

  return {
    ...mapProjectRow(data as Record<string, unknown>, files.length),
    files,
  };
}

/** 대시보드 통계 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const projects = await getProjects();
  return {
    total: projects.length,
    completed: projects.filter((p) => p.status === "completed").length,
    inProgress: projects.filter(
      (p) =>
        p.status === "ready" ||
        p.status === "analyzing" ||
        p.status === "draft",
    ).length,
  };
}

/** 최근 N개 프로젝트 */
export async function getRecentProjects(limit = 3): Promise<Project[]> {
  const projects = await getProjects();
  return projects.slice(0, limit);
}
