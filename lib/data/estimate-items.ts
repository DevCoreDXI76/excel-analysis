import { createClient } from "@/lib/supabase/server";
import { mapEstimateItemRow } from "@/lib/supabase/map-row";
import type { EstimateItem } from "@/types/estimate-item";

/** 프로젝트의 견적/내역 항목 목록 (RLS 적용) */
export async function getEstimateItemsByProjectId(
  projectId: string,
): Promise<EstimateItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getEstimateItemsByProjectId]", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapEstimateItemRow(row as Record<string, unknown>),
  );
}

/** 프로젝트 항목 개수 */
export async function getEstimateItemCount(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("estimate_items")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    console.error("[getEstimateItemCount]", error.message);
    return 0;
  }

  return count ?? 0;
}
