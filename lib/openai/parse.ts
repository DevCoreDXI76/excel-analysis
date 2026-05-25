import { createOpenAIClient } from "@/lib/openai/client";
import {
  ESTIMATE_ITEMS_JSON_SCHEMA,
  PARSE_SYSTEM_PROMPT,
} from "@/lib/openai/schema";
import {
  buildSheetPayloadForAI,
  type SheetDataForAI,
} from "@/lib/excel/extract-sheet-data";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_ROWS_PER_CHUNK = 50;

/** OpenAI 응답 1건 (snake_case, 정규화 후) */
export interface ParsedEstimateItemRow {
  sheet_name: string;
  source_row_index: number;
  room_name: string;
  category: string;
  item_name: string;
  supplied_product: string;
  manufacturer: string;
  quantity: number;
  unit: string;
  material_cost_unit: number;
  material_cost_total: number;
  ingredient_cost_unit: number;
  ingredient_cost_total: number;
  labor_cost_unit: number;
  labor_cost_total: number;
  remarks: string;
  extra_fields: Record<string, string>;
}

interface RawParsedEstimateItemRow extends Omit<
  ParsedEstimateItemRow,
  "extra_fields"
> {
  extra_fields_json: string;
  extra_fields?: Record<string, string>;
}

function parseExtraFieldsJson(raw: string | undefined): Record<string, string> {
  if (!raw?.trim() || raw.trim() === "{}") return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        parsed as Record<string, unknown>,
      )) {
        if (value != null && String(value).trim()) {
          result[key] = String(value);
        }
      }
      return result;
    }
  } catch {
    /* fall through */
  }
  return {};
}

function normalizeParsedItem(item: RawParsedEstimateItemRow): ParsedEstimateItemRow {
  const extraFields =
    item.extra_fields && Object.keys(item.extra_fields).length > 0
      ? item.extra_fields
      : parseExtraFieldsJson(item.extra_fields_json);

  return {
    sheet_name: item.sheet_name,
    source_row_index: item.source_row_index,
    room_name: item.room_name,
    category: item.category,
    item_name: item.item_name,
    supplied_product: item.supplied_product,
    manufacturer: item.manufacturer,
    quantity: item.quantity,
    unit: item.unit,
    material_cost_unit: item.material_cost_unit,
    material_cost_total: item.material_cost_total,
    ingredient_cost_unit: item.ingredient_cost_unit,
    ingredient_cost_total: item.ingredient_cost_total,
    labor_cost_unit: item.labor_cost_unit,
    labor_cost_total: item.labor_cost_total,
    remarks: item.remarks,
    extra_fields: extraFields,
  };
}

function getParseModel(): string {
  return process.env.OPENAI_PARSE_MODEL?.trim() || DEFAULT_MODEL;
}

function chunkSheetRows(sheet: SheetDataForAI): SheetDataForAI[] {
  if (sheet.rows.length <= MAX_ROWS_PER_CHUNK) {
    return [sheet];
  }

  const chunks: SheetDataForAI[] = [];
  for (let i = 0; i < sheet.rows.length; i += MAX_ROWS_PER_CHUNK) {
    chunks.push({
      ...sheet,
      rows: sheet.rows.slice(i, i + MAX_ROWS_PER_CHUNK),
    });
  }
  return chunks;
}

async function parseSheetChunk(
  sheets: SheetDataForAI[],
  context: { projectName: string; fileName: string },
): Promise<ParsedEstimateItemRow[]> {
  const openai = createOpenAIClient();
  const userContent = buildSheetPayloadForAI(
    sheets,
    context.fileName,
    context.projectName,
  );

  const response = await openai.chat.completions.create({
    model: getParseModel(),
    messages: [
      { role: "system", content: PARSE_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "estimate_items",
        strict: true,
        schema: ESTIMATE_ITEMS_JSON_SCHEMA,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답이 비어 있습니다.");
  }

  let parsed: { items: RawParsedEstimateItemRow[] };
  try {
    parsed = JSON.parse(content) as { items: RawParsedEstimateItemRow[] };
  } catch {
    throw new Error("OpenAI 응답 JSON 파싱에 실패했습니다.");
  }

  return (parsed.items ?? [])
    .map(normalizeParsedItem)
    .filter((item) => item.item_name && item.item_name.trim().length > 0);
}

/** OpenAI Structured Output으로 견적 항목 추출 (시트·행 청크) */
export async function parseEstimateItemsFromSheets(
  sheets: SheetDataForAI[],
  context: { projectName: string; fileName: string },
): Promise<ParsedEstimateItemRow[]> {
  const allItems: ParsedEstimateItemRow[] = [];

  for (const sheet of sheets) {
    const chunks = chunkSheetRows(sheet);
    for (const chunk of chunks) {
      const items = await parseSheetChunk([chunk], context);
      allItems.push(...items);
    }
  }

  if (allItems.length === 0) {
    throw new Error("NO_ITEMS");
  }

  return allItems;
}

/** OpenAI/파싱 오류 → 한국어 메시지 */
export function mapParseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message === "NO_ITEMS") {
    return "추출된 항목이 없습니다. 엑셀 형식을 확인하거나 다른 파일로 시도해 주세요.";
  }
  if (message.includes("OPENAI_API_KEY")) {
    return "OpenAI API 키가 설정되지 않았습니다. .env.local의 OPENAI_API_KEY를 확인해 주세요.";
  }
  if (message.includes("401") || message.includes("Incorrect API key")) {
    return "OpenAI API 키가 올바르지 않습니다.";
  }
  if (message.includes("429") || message.includes("rate limit")) {
    return "OpenAI API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (
    message.includes("context_length") ||
    message.includes("maximum context")
  ) {
    return "파일이 너무 큽니다. 시트 또는 행 수를 줄여 주세요.";
  }
  if (message.includes("Invalid schema") || message.includes("response_format")) {
    return "AI 파싱 스키마 오류입니다. 관리자에게 문의하거나 잠시 후 다시 시도해 주세요.";
  }

  return `AI 파싱 중 오류가 발생했습니다. (${message})`;
}
