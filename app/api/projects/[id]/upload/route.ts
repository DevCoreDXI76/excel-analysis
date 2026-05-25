import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  STORAGE_BUCKET_PROJECT_FILES,
  STORAGE_BUCKET_SETUP_HINT,
} from "@/lib/constants/storage";

interface ParsedSheet {
  sheetName: string;
  sheetIndex: number;
  rowCount: number | null;
  columnHeaders: string[];
}

function parseExcelSheets(buffer: ArrayBuffer): ParsedSheet[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  return workbook.SheetNames.map((sheetName, sheetIndex) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: "",
    }) as string[][];
    const headerRow = rows[0] ?? [];
    const columnHeaders = headerRow
      .map((cell) => String(cell ?? "").trim())
      .filter(Boolean);
    return {
      sheetName,
      sheetIndex,
      rowCount: Math.max(0, rows.length - 1),
      columnHeaders,
    };
  });
}

function parseCsvSheet(text: string): ParsedSheet[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headerLine = lines[0] ?? "";
  const columnHeaders = headerLine
    .split(",")
    .map((cell) => cell.trim())
    .filter(Boolean);
  return [
    {
      sheetName: "Sheet1",
      sheetIndex: 0,
      rowCount: Math.max(0, lines.length - 1),
      columnHeaders,
    },
  ];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
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

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      return NextResponse.json(
        { error: ".xlsx, .csv 파일만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 },
      );
    }

    if (
      file.type &&
      !ALLOWED_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      // 일부 브라우저는 csv mime이 비어 있을 수 있음 — 확장자로 이미 검증
    }

    const fileId = randomUUID();
    const storagePath = `${projectId}/${fileId}/${file.name}`;
    const buffer = await file.arrayBuffer();

    let parsedSheets: ParsedSheet[] = [];
    if (ext === "xlsx") {
      parsedSheets = parseExcelSheets(buffer);
    } else {
      parsedSheets = parseCsvSheet(new TextDecoder().decode(buffer));
    }

    const { count: existingCount } = await supabase
      .from("project_files")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    // Storage 업로드 — 사용자 세션 우선
    let uploadError = (
      await supabase.storage
        .from(STORAGE_BUCKET_PROJECT_FILES)
        .upload(storagePath, buffer, {
          contentType: file.type || undefined,
          upsert: false,
        })
    ).error;

    // Storage RLS 미설정 시 Service Role fallback (프로젝트 소유권은 위에서 확인)
    if (uploadError) {
      console.warn(
        "[upload] user session storage failed, trying service role:",
        uploadError.message,
      );
      console.warn(`[upload] ${STORAGE_BUCKET_SETUP_HINT}`);
      const serviceClient = createServiceClient();
      uploadError = (
        await serviceClient.storage
          .from(STORAGE_BUCKET_PROJECT_FILES)
          .upload(storagePath, buffer, {
            contentType: file.type || undefined,
            upsert: false,
          })
      ).error;
    }

    if (uploadError) {
      console.error("[POST /api/projects/upload]", uploadError.message);
      if (uploadError.message.includes("Bucket not found")) {
        return NextResponse.json(
          {
            error: `Storage 버킷이 없습니다. ${STORAGE_BUCKET_SETUP_HINT}`,
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "파일 업로드에 실패했습니다." },
        { status: 500 },
      );
    }

    const { error: fileError } = await supabase
      .from("project_files")
      .insert({
        id: fileId,
        project_id: projectId,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || null,
        sheet_count: parsedSheets.length,
        upload_order: existingCount ?? 0,
      })
      .select()
      .single();

    if (fileError) {
      console.error("[POST /api/projects/upload] DB insert", fileError.message);
      return NextResponse.json(
        { error: "파일 정보 저장에 실패했습니다." },
        { status: 500 },
      );
    }

    if (parsedSheets.length > 0) {
      const { error: sheetsError } = await supabase.from("file_sheets").insert(
        parsedSheets.map((sheet) => ({
          file_id: fileId,
          sheet_name: sheet.sheetName,
          sheet_index: sheet.sheetIndex,
          row_count: sheet.rowCount,
          column_headers: sheet.columnHeaders,
        })),
      );

      if (sheetsError) {
        console.error(
          "[POST /api/projects/upload] file_sheets",
          sheetsError.message,
        );
      }
    }

    await supabase
      .from("projects")
      .update({ status: "ready" })
      .eq("id", projectId);

    return NextResponse.json({
      fileId,
      fileName: file.name,
      sheets: parsedSheets.map((s) => s.sheetName),
    });
  } catch (error) {
    console.error("[POST /api/projects/upload]", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
