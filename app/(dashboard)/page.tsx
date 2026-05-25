import Link from "next/link";
import { Plus, FolderKanban, CheckCircle2, Loader2 } from "lucide-react";
import { ProjectCard } from "@/components/features/project-card";
import { Button } from "@/components/ui/button";
import {
  getDashboardStats,
  getRecentProjects,
} from "@/lib/data/projects";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentProjects = await getRecentProjects(3);

  const statCards = [
    {
      label: "전체 프로젝트",
      value: stats.total,
      icon: FolderKanban,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "파싱 완료",
      value: stats.parsed,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "진행 중",
      value: stats.inProgress,
      icon: Loader2,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-gray-600">
            최근 분석 프로젝트와 진행 현황을 한눈에 확인하세요.
          </p>
        </div>
        <Link href="/projects">
          <Button className="h-11 px-5">
            <Plus className="h-4 w-4" aria-hidden />새 프로젝트 생성
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">최근 프로젝트</h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            전체 보기
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
            <p className="text-gray-500">아직 프로젝트가 없습니다.</p>
            <Link
              href="/projects"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              첫 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
