import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { extractSheetDataFromBuffer } from "@/lib/excel/extract-sheet-data";
import {
  mapParseError,
  parseEstimateItemsFromSheets,
} from "@/lib/openai/parse";
import type { ParsedEstimateItemRow } from "@/lib/openai/parse";
import { mapProjectFileRow, mapProjectRow } from "@/lib/supabase/map-row";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET_PROJECT_FILES } from "@/lib/constants/storage";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function numOrNull(value: number | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return value;
}

function parseSheetNames(body: Record<string, unknown>): string[] | undefined {
  if (!Array.isArray(body.sheetNames)) return undefined;
  const names = body.sheetNames
    .filter((n): n is string => typeof n === "string")
    .map((n) => n.trim())
    .filter(Boolean);
  return names.length > 0 ? names : undefined;
}

function buildInsertRows(
  parsedItems: ParsedEstimateItemRow[],
  projectId: string,
  fileId: string,
  sortOffset: number,
) {
  return parsedItems.map((item, index) => ({
    id: randomUUID(),
    project_id: projectId,
    file_id: fileId,
    sheet_name: item.sheet_name || "Sheet1",
    source_row_index: item.source_row_index ?? null,
    room_name: emptyToNull(item.room_name),
    category: emptyToNull(item.category),
    item_name: emptyToNull(item.item_name),
    supplied_product: emptyToNull(item.supplied_product),
    specification: null,
    manufacturer: emptyToNull(item.manufacturer),
    quantity: numOrNull(item.quantity),
    unit: emptyToNull(item.unit),
    material_cost_unit: numOrNull(item.material_cost_unit),
    material_cost_total: numOrNull(item.material_cost_total),
    ingredient_cost_unit: numOrNull(item.ingredient_cost_unit),
    ingredient_cost_total: numOrNull(item.ingredient_cost_total),
    labor_cost_unit: numOrNull(item.labor_cost_unit),
    labor_cost_total: numOrNull(item.labor_cost_total),
    unit_price: null,
    total_amount: null,
    remark: emptyToNull(item.remarks),
    extra_fields: item.extra_fields ?? {},
    is_manually_edited: false,
    sort_order: sortOffset + index,
  }));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const targetFileId =
      typeof body.fileId === "string" ? body.fileId : undefined;
    const sheetNames = parseSheetNames(body);
    const replaceExisting = body.replaceExisting === true;
    const append = body.append === true;
    const isSelectiveParse = Boolean(sheetNames?.length);

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        project_files (*)
      `,
      )
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !projectData) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const project = mapProjectRow(projectData as Record<string, unknown>);
    const rawFiles = (projectData.project_files ?? []) as Record<
      string,
      unknown
    >[];
    const files = rawFiles.map((f) => mapProjectFileRow(f));

    const filesToParse = targetFileId
      ? files.filter((f) => f.id === targetFileId)
      : files;

    if (files.length === 0) {
      return NextResponse.json(
        { error: "파싱할 파일을 먼저 업로드해 주세요." },
        { status: 400 },
      );
    }

    if (targetFileId && filesToParse.length === 0) {
      return NextResponse.json(
        { error: "지정한 파일을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (isSelectiveParse && !targetFileId) {
      return NextResponse.json(
        { error: "시트 선택 파싱에는 fileId가 필요합니다." },
        { status: 400 },
      );
    }

    await supabase
      .from("projects")
      .update({ status: "parsing" })
      .eq("id", projectId);

    const serviceClient = createServiceClient();
    const model =
      process.env.OPENAI_PARSE_MODEL?.trim() || "gpt-4o-mini";

    let totalExtracted = 0;
    const errors: string[] = [];
    const parsedFileIds: string[] = [];

    for (const file of filesToParse) {
      const jobId = randomUUID();
      const startedAt = new Date().toISOString();

      await supabase
        .from("project_files")
        .update({ parse_status: "parsing" })
        .eq("id", file.id);

      await supabase.from("parse_jobs").insert({
        id: jobId,
        project_id: projectId,
        file_id: file.id,
        status: "processing",
        model,
        started_at: startedAt,
      });

      try {
        const { data: blob, error: downloadError } =
          await serviceClient.storage
            .from(STORAGE_BUCKET_PROJECT_FILES)
            .download(file.storagePath);

        if (downloadError || !blob) {
          throw new Error(
            `Storage에서 파일을 읽을 수 없습니다: ${file.fileName}`,
          );
        }

        const buffer = await blob.arrayBuffer();
        const sheets = extractSheetDataFromBuffer(buffer, file.fileName, {
          sheetNames: isSelectiveParse ? sheetNames : undefined,
        });

        if (sheets.length === 0 || sheets.every((s) => s.rows.length === 0)) {
          throw new Error(
            isSelectiveParse
              ? "선택한 시트에서 파싱할 데이터 행이 없습니다."
              : "NO_DATA",
          );
        }

        const parsedItems = await parseEstimateItemsFromSheets(sheets, {
          projectName: project.name,
          fileName: file.fileName,
        });

        if (replaceExisting || !isSelectiveParse) {
          await supabase
            .from("estimate_items")
            .delete()
            .eq("file_id", file.id);
        }

        let sortOffset = 0;
        if (append) {
          const { data: maxSort } = await supabase
            .from("estimate_items")
            .select("sort_order")
            .eq("file_id", file.id)
            .order("sort_order", { ascending: false })
            .limit(1)
            .maybeSingle();

          sortOffset = (maxSort?.sort_order ?? -1) + 1;
        }

        const insertRows = buildInsertRows(
          parsedItems,
          projectId,
          file.id,
          sortOffset,
        );

        const { error: insertError } = await supabase
          .from("estimate_items")
          .insert(insertRows);

        if (insertError) {
          throw new Error(insertError.message);
        }

        const completedAt = new Date().toISOString();

        await supabase
          .from("parse_jobs")
          .update({
            status: "completed",
            rows_extracted: parsedItems.length,
            completed_at: completedAt,
          })
          .eq("id", jobId);

        await supabase
          .from("project_files")
          .update({ parse_status: "parsed" })
          .eq("id", file.id);

        totalExtracted += parsedItems.length;
        parsedFileIds.push(file.id);

        if (isSelectiveParse) {
          await supabase
            .from("projects")
            .update({ status: "parsed" })
            .eq("id", projectId);

          return NextResponse.json({
            rowsExtracted: parsedItems.length,
            sheetName: sheetNames![0],
            sheetNames: sheetNames,
            fileId: file.id,
          });
        }
      } catch (fileError) {
        const errorMessage =
          fileError instanceof Error && fileError.message === "NO_DATA"
            ? "파싱할 데이터 행이 없습니다."
            : mapParseError(fileError);

        errors.push(`${file.fileName}: ${errorMessage}`);

        await supabase
          .from("parse_jobs")
          .update({
            status: "failed",
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);

        await supabase
          .from("project_files")
          .update({ parse_status: "failed" })
          .eq("id", file.id);

        if (isSelectiveParse) {
          await supabase
            .from("projects")
            .update({ status: "failed" })
            .eq("id", projectId);

          return NextResponse.json(
            {
              error: errorMessage,
              sheetName: sheetNames?.[0],
            },
            { status: 500 },
          );
        }
      }
    }

    if (parsedFileIds.length === 0) {
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", projectId);

      return NextResponse.json(
        {
          error: errors[0] ?? "AI 파싱에 실패했습니다.",
          errors,
        },
        { status: 500 },
      );
    }

    await supabase
      .from("projects")
      .update({ status: "parsed" })
      .eq("id", projectId);

    return NextResponse.json({
      rowsExtracted: totalExtracted,
      filesParsed: parsedFileIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[POST /api/projects/parse]", error);

    try {
      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", projectId);
    } catch {
      // best-effort
    }

    return NextResponse.json(
      { error: mapParseError(error) },
      { status: 500 },
    );
  }
}
