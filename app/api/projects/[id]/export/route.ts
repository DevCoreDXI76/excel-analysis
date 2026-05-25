import { NextResponse } from "next/server";
import { verifyProjectAccess } from "@/lib/api/verify-project";
import {
  buildContentDisposition,
  buildExportFilename,
  buildExportWorkbookBuffer,
} from "@/lib/excel/build-export-workbook";
import { mapEstimateItemRow } from "@/lib/supabase/map-row";

export const dynamic = "force-dynamic";

/** POST — estimate_items → 회사 양식 xlsx 다운로드 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const access = await verifyProjectAccess(projectId);
  if ("error" in access) return access.error;

  const { supabase } = access;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "프로젝트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const { data: rows, error: itemsError } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("[POST /api/projects/export]", itemsError.message);
    return NextResponse.json(
      { error: "항목을 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const items = (rows ?? []).map((row) =>
    mapEstimateItemRow(row as Record<string, unknown>),
  );

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Export할 항목이 없습니다. AI 파싱 또는 행 추가 후 다시 시도해 주세요." },
      { status: 400 },
    );
  }

  const exportedAt = new Date();
  const filename = buildExportFilename(project.name, exportedAt);
  const buffer = buildExportWorkbookBuffer(project.name, items, exportedAt);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": buildContentDisposition(filename),
      "Cache-Control": "no-store",
    },
  });
}
