"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, Table2, ArrowUpDown } from "lucide-react";
import type { EstimateItem } from "@/types/estimate-item";
import { ParseActionBar } from "@/components/features/parse-action-bar";
import { ExportButton } from "@/components/features/export-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EstimateItemsTableProps {
  projectId: string;
  initialItems: EstimateItem[];
  hasFiles: boolean;
  defaultFileId: string | null;
}

type SortKey =
  | "roomName"
  | "category"
  | "itemName"
  | "manufacturer"
  | "quantity"
  | "materialCostTotal"
  | "sortOrder";

type EditableField =
  | "roomName"
  | "category"
  | "itemName"
  | "suppliedProduct"
  | "manufacturer"
  | "quantity"
  | "unit"
  | "materialCostUnit"
  | "materialCostTotal"
  | "ingredientCostUnit"
  | "ingredientCostTotal"
  | "laborCostUnit"
  | "laborCostTotal"
  | "remark";

const NUMERIC_FIELDS: EditableField[] = [
  "quantity",
  "materialCostUnit",
  "materialCostTotal",
  "ingredientCostUnit",
  "ingredientCostTotal",
  "laborCostUnit",
  "laborCostTotal",
];

const EDITABLE_FIELDS: {
  key: EditableField;
  label: string;
  align?: "right";
  sortKey?: SortKey;
}[] = [
  { key: "roomName", label: "회의실명", sortKey: "roomName" },
  { key: "category", label: "구분", sortKey: "category" },
  { key: "itemName", label: "품명", sortKey: "itemName" },
  { key: "suppliedProduct", label: "공급 제품" },
  { key: "manufacturer", label: "제조사", sortKey: "manufacturer" },
  { key: "quantity", label: "수량", align: "right", sortKey: "quantity" },
  { key: "unit", label: "단위" },
  {
    key: "materialCostUnit",
    label: "자재비 단가",
    align: "right",
  },
  {
    key: "materialCostTotal",
    label: "자재비 합계",
    align: "right",
    sortKey: "materialCostTotal",
  },
  { key: "ingredientCostUnit", label: "재료비 단가", align: "right" },
  { key: "ingredientCostTotal", label: "재료비 합계", align: "right" },
  { key: "laborCostUnit", label: "노무비 단가", align: "right" },
  { key: "laborCostTotal", label: "노무비 합계", align: "right" },
  { key: "remark", label: "비고" },
];

function fieldValue(item: EstimateItem, field: EditableField): string {
  const val = item[field];
  if (val == null) return "";
  return String(val);
}

function parseFieldValue(
  field: EditableField,
  raw: string,
): string | number | null {
  if (NUMERIC_FIELDS.includes(field)) {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const num = Number(trimmed.replace(/,/g, ""));
    return Number.isNaN(num) ? null : num;
  }
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

export function EstimateItemsTable({
  projectId,
  initialItems,
  hasFiles,
  defaultFileId,
}: EstimateItemsTableProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("sortOrder");
  const [sortAsc, setSortAsc] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        (item.roomName ?? "").toLowerCase().includes(q) ||
        (item.itemName ?? "").toLowerCase().includes(q) ||
        (item.suppliedProduct ?? "").toLowerCase().includes(q) ||
        (item.manufacturer ?? "").toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv), "ko");
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [items, search, categoryFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const saveField = useCallback(
    async (item: EstimateItem, field: EditableField, raw: string) => {
      const parsed = parseFieldValue(field, raw);
      const current = item[field];
      if (parsed === current || (parsed == null && current == null)) return;

      setSavingIds((prev) => new Set(prev).add(item.id));
      setError(null);

      try {
        const res = await fetch(
          `/api/projects/${projectId}/items/${item.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: parsed }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "저장에 실패했습니다.");

        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? data.item : row)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [projectId],
  );

  const handleAddRow = async () => {
    if (!defaultFileId) {
      setError("파일을 먼저 업로드해 주세요.");
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: defaultFileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "행 추가에 실패했습니다.");
      setItems((prev) => [...prev, data.item]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "행 추가에 실패했습니다.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}건을 삭제할까요?`)) return;

    setError(null);
    const ids = Array.from(selectedIds);

    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/projects/${projectId}/items/${id}`, {
            method: "DELETE",
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error ?? "삭제에 실패했습니다.");
            }
          }),
        ),
      );
      setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <Table2 className="h-5 w-5 text-blue-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-gray-900">견적·내역 데이터</h2>
              <p className="text-xs text-gray-500">
                {items.length}건 · 셀 수정 후 포커스를 벗어나면 자동 저장
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <ParseActionBar projectId={projectId} hasFiles={hasFiles} />
            <ExportButton projectId={projectId} itemCount={items.length} />
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="회의실·품명·공급제품 검색"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">전체 구분</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            className="h-9"
            onClick={handleAddRow}
            disabled={!defaultFileId}
          >
            <Plus className="h-4 w-4" aria-hidden />행 추가
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-9 text-red-600 hover:text-red-700"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            선택 삭제 ({selectedIds.size})
          </Button>
        </div>
      )}

      {error && (
        <p className="mx-5 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-auto p-5">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-lg bg-gray-50 py-12 text-center">
            <Table2 className="mb-3 h-8 w-8 text-gray-300" aria-hidden />
            {!hasFiles ? (
              <p className="text-sm text-gray-500">
                왼쪽에서 엑셀 파일을 먼저 업로드해 주세요.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  아직 파싱된 항목이 없습니다.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  파일 업로드 시 자동 파싱되거나, &quot;AI 파싱&quot; 버튼으로
                  재실행할 수 있습니다.
                </p>
                {defaultFileId && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-4"
                    onClick={handleAddRow}
                  >
                    <Plus className="h-4 w-4" aria-hidden />행 추가
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 w-10 bg-gray-50 px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={
                        filteredItems.length > 0 &&
                        selectedIds.size === filteredItems.length
                      }
                      onChange={toggleSelectAll}
                      aria-label="전체 선택"
                    />
                  </th>
                  {EDITABLE_FIELDS.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-2 py-2.5 text-left text-xs font-medium text-gray-600",
                        col.align === "right" && "text-right",
                      )}
                    >
                      {col.sortKey ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.sortKey!)}
                          className="inline-flex items-center gap-1 hover:text-gray-900"
                        >
                          {col.label}
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                  <th className="w-14 px-2 py-2.5 text-xs text-gray-500">
                    수정
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      savingIds.has(item.id) && "bg-blue-50/40",
                      selectedIds.has(item.id) && "bg-blue-50/60",
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-white px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        aria-label={`${item.itemName ?? "항목"} 선택`}
                      />
                    </td>
                    {EDITABLE_FIELDS.map((col) => (
                      <td key={col.key} className="px-1 py-1">
                        <input
                          type="text"
                          inputMode={
                            NUMERIC_FIELDS.includes(col.key)
                              ? "decimal"
                              : "text"
                          }
                          defaultValue={fieldValue(item, col.key)}
                          key={`${item.id}-${col.key}-${item.updatedAt}`}
                          onBlur={(e) =>
                            saveField(item, col.key, e.target.value)
                          }
                          className={cn(
                            "w-full min-w-[64px] rounded border border-transparent bg-transparent px-2 py-1.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400",
                            col.align === "right" && "text-right",
                          )}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center">
                      {item.isManuallyEdited ? (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          수정
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">
                검색 조건에 맞는 항목이 없습니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
