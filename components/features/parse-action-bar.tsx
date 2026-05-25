"use client";

interface ParseActionBarProps {
  projectId: string;
  hasFiles: boolean;
  fileId?: string;
}

export function ParseActionBar({
  hasFiles,
}: ParseActionBarProps) {
  if (!hasFiles) {
    return (
      <p className="text-xs text-gray-500">
        파일을 업로드한 뒤 왼쪽에서 파싱할 시트를 선택하세요.
      </p>
    );
  }

  return (
    <p className="text-xs text-gray-500">
      왼쪽 패널에서 파싱할 시트를 선택한 뒤 「선택한 시트 AI 파싱 시작」을
      누르세요. 시트는 순차 처리되어 타임아웃을 방지합니다.
    </p>
  );
}
