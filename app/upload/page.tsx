import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * 업로드 페이지 (Phase 2에서 file-uploader 컴포넌트로 구현 예정)
 */
export default function UploadPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-12 md:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        홈으로
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">파일 업로드</h1>
      <p className="mt-2 text-gray-600">
        Phase 2에서 드래그앤드롭 업로드 UI가 이곳에 구현됩니다.
      </p>
      <div className="mt-8 flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
        .xlsx, .csv 파일 업로드 영역 (준비 중)
      </div>
    </div>
  );
}
