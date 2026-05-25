import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapProjectRow } from "@/lib/supabase/map-row";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "프로젝트명을 입력해 주세요.").max(200),
  description: z.string().max(1000).optional().nullable(),
});

export async function POST(request: Request) {
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

    const body = CreateProjectSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.issues[0]?.message ?? "잘못된 요청입니다." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: body.data.name,
        description: body.data.description ?? null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/projects]", error.message);
      return NextResponse.json(
        { error: "프로젝트 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      project: mapProjectRow(data as Record<string, unknown>, 0),
    });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
