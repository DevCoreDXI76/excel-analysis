/** API 응답 JSON 안전 파싱 (Vercel 504 HTML/텍스트 대응) */
export async function readParseApiResponse(
  res: Response,
): Promise<{ data: Record<string, unknown>; ok: boolean }> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as Record<string, unknown>;
    return { data, ok: res.ok };
  }

  const text = await res.text();
  const trimmed = text.trim();

  if (res.status === 504 || res.status === 502 || res.status === 503) {
    throw new Error(
      "서버 응답 시간이 초과되었습니다(약 2분). 시트가 많은 파일은 잠시 후 다시 시도하거나, 시트 수가 적은 파일로 테스트해 주세요.",
    );
  }

  if (
    trimmed.startsWith("An error occurred") ||
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html")
  ) {
    throw new Error(
      "서버에서 예기치 않은 응답을 받았습니다. 시트가 많으면 처리 시간 초과일 수 있습니다. 잠시 후 AI 파싱을 다시 시도해 주세요.",
    );
  }

  throw new Error(
    typeof text === "string" && text.length > 0 && text.length < 200
      ? text
      : "AI 파싱 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

export function getParseApiErrorMessage(
  data: Record<string, unknown>,
  fallback: string,
): string {
  return typeof data.error === "string" ? data.error : fallback;
}
