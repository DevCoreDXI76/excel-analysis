"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectCard } from "@/components/features/project-card";
import { Button } from "@/components/ui/button";
import { MOCK_PROJECTS } from "@/lib/mock/projects";
import { cn } from "@/lib/utils/cn";

type FilterTab = "all" | "inProgress" | "completed";

const tabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "inProgress", label: "진행 중" },
  { id: "completed", label: "완료" },
];

function filterProjects(tab: FilterTab) {
  if (tab === "all") return MOCK_PROJECTS;
  if (tab === "completed")
    return MOCK_PROJECTS.filter((p) => p.status === "completed");
  return MOCK_PROJECTS.filter(
    (p) =>
      p.status === "ready" ||
      p.status === "analyzing" ||
      p.status === "draft",
  );
}

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const projects = filterProjects(activeTab);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 프로젝트</h1>
          <p className="mt-1 text-sm text-gray-600">
            공사내역·견적 엑셀을 프로젝트 단위로 관리합니다.
          </p>
        </div>
        <Button
          className="h-11 px-5"
          onClick={() =>
            alert("Phase 3에서 Supabase 연동 후 프로젝트 생성 기능이 추가됩니다.")
          }
        >
          <Plus className="h-4 w-4" aria-hidden />새 프로젝트 생성
        </Button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">해당 조건의 프로젝트가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        프로젝트를 클릭하면{" "}
        <Link href="/projects/1" className="text-blue-600 hover:underline">
          분석 워크스페이스
        </Link>
        로 이동합니다.
      </p>
    </div>
  );
}
