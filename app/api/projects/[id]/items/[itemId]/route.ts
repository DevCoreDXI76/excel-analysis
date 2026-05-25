import { NextResponse } from "next/server";
import {
  parseOptionalNumber,
  parseOptionalString,
  verifyProjectAccess,
} from "@/lib/api/verify-project";
import { mapEstimateItemRow } from "@/lib/supabase/map-row";

export const dynamic = "force-dynamic";

/** PATCH — 항목 수정 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id: projectId, itemId } = await params;
  const access = await verifyProjectAccess(projectId);
  if ("error" in access) return access.error;

  const { supabase } = access;
  const body = await request.json().catch(() => ({}));

  const updates: Record<string, unknown> = {
    is_manually_edited: true,
  };

  const category = parseOptionalString(body.category);
  if (category !== undefined) updates.category = category;
  const roomName = parseOptionalString(body.roomName);
  if (roomName !== undefined) updates.room_name = roomName;
  const itemName = parseOptionalString(body.itemName);
  if (itemName !== undefined) updates.item_name = itemName;
  const suppliedProduct = parseOptionalString(body.suppliedProduct);
  if (suppliedProduct !== undefined) updates.supplied_product = suppliedProduct;
  const specification = parseOptionalString(body.specification);
  if (specification !== undefined) updates.specification = specification;
  const manufacturer = parseOptionalString(body.manufacturer);
  if (manufacturer !== undefined) updates.manufacturer = manufacturer;
  const unit = parseOptionalString(body.unit);
  if (unit !== undefined) updates.unit = unit;
  const remark = parseOptionalString(body.remark);
  if (remark !== undefined) updates.remark = remark;

  const quantity = parseOptionalNumber(body.quantity);
  if (quantity !== undefined) updates.quantity = quantity;
  const materialCostUnit = parseOptionalNumber(body.materialCostUnit);
  if (materialCostUnit !== undefined)
    updates.material_cost_unit = materialCostUnit;
  const materialCostTotal = parseOptionalNumber(body.materialCostTotal);
  if (materialCostTotal !== undefined)
    updates.material_cost_total = materialCostTotal;
  const ingredientCostUnit = parseOptionalNumber(body.ingredientCostUnit);
  if (ingredientCostUnit !== undefined)
    updates.ingredient_cost_unit = ingredientCostUnit;
  const ingredientCostTotal = parseOptionalNumber(body.ingredientCostTotal);
  if (ingredientCostTotal !== undefined)
    updates.ingredient_cost_total = ingredientCostTotal;
  const laborCostUnit = parseOptionalNumber(body.laborCostUnit);
  if (laborCostUnit !== undefined) updates.labor_cost_unit = laborCostUnit;
  const laborCostTotal = parseOptionalNumber(body.laborCostTotal);
  if (laborCostTotal !== undefined) updates.labor_cost_total = laborCostTotal;
  const unitPrice = parseOptionalNumber(body.unitPrice);
  if (unitPrice !== undefined) updates.unit_price = unitPrice;
  const totalAmount = parseOptionalNumber(body.totalAmount);
  if (totalAmount !== undefined) updates.total_amount = totalAmount;

  const { data, error } = await supabase
    .from("estimate_items")
    .update(updates)
    .eq("id", itemId)
    .eq("project_id", projectId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[PATCH /api/projects/items]", error.message);
    return NextResponse.json(
      { error: "항목 수정에 실패했습니다." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "항목을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    item: mapEstimateItemRow(data as Record<string, unknown>),
  });
}

/** DELETE — 항목 삭제 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id: projectId, itemId } = await params;
  const access = await verifyProjectAccess(projectId);
  if ("error" in access) return access.error;

  const { supabase } = access;

  const { error } = await supabase
    .from("estimate_items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) {
    console.error("[DELETE /api/projects/items]", error.message);
    return NextResponse.json(
      { error: "항목 삭제에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
