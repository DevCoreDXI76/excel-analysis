/** 견적/내역 항목 (DB estimate_items) */
export interface EstimateItem {
  id: string;
  projectId: string;
  fileId: string;
  sheetName: string;
  sourceRowIndex: number | null;
  roomName: string | null;
  category: string | null;
  itemName: string | null;
  suppliedProduct: string | null;
  specification: string | null;
  manufacturer: string | null;
  quantity: number | null;
  unit: string | null;
  materialCostUnit: number | null;
  materialCostTotal: number | null;
  ingredientCostUnit: number | null;
  ingredientCostTotal: number | null;
  laborCostUnit: number | null;
  laborCostTotal: number | null;
  unitPrice: number | null;
  totalAmount: number | null;
  remark: string | null;
  extraFields: Record<string, unknown>;
  isManuallyEdited: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
