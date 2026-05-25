import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  parseOptionalNumber,
  parseOptionalString,
  verifyProjectAccess,
} from "@/lib/api/verify-project";
import { mapEstimateItemRow } from "@/lib/supabase/map-row";

export const dynamic = "force-dynamic";

/** GET — 프로젝트 항목 목록 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const access = await verifyProjectAccess(projectId);
  if ("error" in access) return access.error;

  const { supabase } = access;
  const { data, error } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/projects/items]", error.message);
    return NextResponse.json(
      { error: "항목 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  const items = (data ?? []).map((row) =>
    mapEstimateItemRow(row as Record<string, unknown>),
  );

  return NextResponse.json({ items });
}

/** POST — 항목 추가 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const access = await verifyProjectAccess(projectId);
  if ("error" in access) return access.error;

  const { supabase } = access;
  const body = await request.json().catch(() => ({}));

  let fileId = typeof body.fileId === "string" ? body.fileId : undefined;

  if (!fileId) {
    const { data: files } = await supabase
      .from("project_files")
      .select("id")
      .eq("project_id", projectId)
      .order("upload_order", { ascending: true })
      .limit(1);

    fileId = files?.[0]?.id;
  }

  if (!fileId) {
    return NextResponse.json(
      { error: "파일을 먼저 업로드한 뒤 항목을 추가할 수 있습니다." },
      { status: 400 },
    );
  }

  const { data: maxSort } = await supabase
    .from("estimate_items")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const itemName = parseOptionalString(body.itemName);
  const newId = randomUUID();

  const { data, error } = await supabase
    .from("estimate_items")
    .insert({
      id: newId,
      project_id: projectId,
      file_id: fileId,
      sheet_name:
        parseOptionalString(body.sheetName) ?? "수동입력",
      source_row_index: null,
      category: parseOptionalString(body.category) ?? null,
      room_name: parseOptionalString(body.roomName) ?? null,
      item_name: itemName ?? "새 항목",
      supplied_product: parseOptionalString(body.suppliedProduct) ?? null,
      specification: parseOptionalString(body.specification) ?? null,
      manufacturer: parseOptionalString(body.manufacturer) ?? null,
      quantity: parseOptionalNumber(body.quantity) ?? null,
      unit: parseOptionalString(body.unit) ?? null,
      material_cost_unit: parseOptionalNumber(body.materialCostUnit) ?? null,
      material_cost_total: parseOptionalNumber(body.materialCostTotal) ?? null,
      ingredient_cost_unit:
        parseOptionalNumber(body.ingredientCostUnit) ?? null,
      ingredient_cost_total:
        parseOptionalNumber(body.ingredientCostTotal) ?? null,
      labor_cost_unit: parseOptionalNumber(body.laborCostUnit) ?? null,
      labor_cost_total: parseOptionalNumber(body.laborCostTotal) ?? null,
      unit_price: parseOptionalNumber(body.unitPrice) ?? null,
      total_amount: parseOptionalNumber(body.totalAmount) ?? null,
      remark: parseOptionalString(body.remark) ?? null,
      extra_fields: {},
      is_manually_edited: true,
      sort_order: (maxSort?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/projects/items]", error.message);
    return NextResponse.json(
      { error: "항목 추가에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    item: mapEstimateItemRow(data as Record<string, unknown>),
  });
}
