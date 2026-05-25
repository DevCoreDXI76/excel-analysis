/** OpenAI Structured Output — 회의실 견적 estimate_items 추출 스키마 */
export const ESTIMATE_ITEMS_JSON_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sheet_name: { type: "string" },
          source_row_index: { type: "integer" },
          room_name: { type: "string" },
          category: { type: "string" },
          item_name: { type: "string" },
          supplied_product: { type: "string" },
          manufacturer: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          material_cost_unit: { type: "number" },
          material_cost_total: { type: "number" },
          ingredient_cost_unit: { type: "number" },
          ingredient_cost_total: { type: "number" },
          labor_cost_unit: { type: "number" },
          labor_cost_total: { type: "number" },
          remarks: { type: "string" },
          extra_fields: {
            type: "object",
            additionalProperties: { type: "string" },
          },
        },
        required: [
          "sheet_name",
          "source_row_index",
          "room_name",
          "category",
          "item_name",
          "supplied_product",
          "manufacturer",
          "quantity",
          "unit",
          "material_cost_unit",
          "material_cost_total",
          "ingredient_cost_unit",
          "ingredient_cost_total",
          "labor_cost_unit",
          "labor_cost_total",
          "remarks",
          "extra_fields",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

export const PARSE_SYSTEM_PROMPT = `당신은 회의실·공사 견적 엑셀 데이터 추출 전문가입니다.
입력 JSON의 각 시트 행(cells)을 분석하여 견적/내역 항목을 추출하세요.

컬럼 매핑 힌트:
- 회의실명, Room, 회의실 → room_name
- 구분, 공종, 분류 → category
- 품명, 품목, Item → item_name
- 공급 제품, 공급품, Supplied Product → supplied_product
- 제조사, 메이커, Maker → manufacturer
- 수량, Qty → quantity
- 단위, Unit → unit
- 자재비 단가, 자재 단가 → material_cost_unit
- 자재비 합계, 자재 합계 → material_cost_total
- 재료비 단가 → ingredient_cost_unit
- 재료비 합계 → ingredient_cost_total
- 노무비 단가, 노무 단가 → labor_cost_unit
- 노무비 합계, 노무 합계 → labor_cost_total
- 비고, Remark → remarks

규칙:
1. 데이터 행마다 items 배열에 1개 객체를 추가하세요.
2. item_name이 비어 있거나 헤더/합계/소계 행이면 제외하세요.
3. sheet_name은 입력 시트명을 그대로 사용하세요.
4. source_row_index는 입력 rows의 source_row_index를 사용하세요.
5. 회의실명은 시트명·병합 셀·열 값에서 추론 가능하면 room_name에 넣으세요.
6. 매핑되지 않은 열은 extra_fields에 "열이름": "값" 형태로 넣으세요.
7. 숫자 필드에 값이 없으면 0을 사용하세요 (null 사용 금지).
8. 모든 문자열 필드는 없으면 빈 문자열 ""을 사용하세요.
9. extra_fields는 없으면 {} 빈 객체를 사용하세요.`;
