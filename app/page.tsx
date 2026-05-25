import Link from "next/link";
import { FileSpreadsheet, BarChart3, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-2 font-semibold text-blue-600">
            <FileSpreadsheet className="h-6 w-6" aria-hidden />
            <span>AI 엑셀 분석</span>
          </div>
          <nav className="text-sm text-gray-600">
            <span>Phase 1 — 환경 설정 완료</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16 md:px-8">
        <section className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" aria-hidden />
            AI 기반 데이터 분석
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            엑셀을 업로드하면
            <br />
            AI가 분석하고 차트를 만듭니다
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            복잡한 수식 없이 .xlsx, .csv 파일만 올리면 OpenAI Code
            Interpreter가 통계·인사이트·시각화를 자동으로 생성합니다.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/upload"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 font-medium text-white transition-colors hover:bg-blue-700"
            >
              분석 시작하기
            </Link>
            <a
              href="/docs/03_development_plan.md"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-white px-6 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              개발 로드맵 보기
            </a>
          </div>
        </section>

        <section className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: FileSpreadsheet,
              title: "간편 업로드",
              desc: "드래그앤드롭으로 엑셀·CSV 파일 전송",
            },
            {
              icon: Sparkles,
              title: "AI 자동 분석",
              desc: "Code Interpreter가 Python으로 데이터 처리",
            },
            {
              icon: BarChart3,
              title: "시각화 리포트",
              desc: "차트와 한국어 요약을 한 화면에서 확인",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <Icon className="mb-3 h-8 w-8 text-blue-600" aria-hidden />
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
        AI 엑셀 분석 서비스 · Next.js + Supabase + OpenAI
      </footer>
    </div>
  );
}
