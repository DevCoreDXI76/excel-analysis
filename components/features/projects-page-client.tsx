"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { Project, ProjectStatus } from "@/types/project";
import { ProjectCard } from "@/components/features/project-card";
import { CreateProjectModal } from "@/components/features/create-project-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type FilterTab = "all" | "inProgress" | "completed";

const tabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "inProgress", label: "진행 중" },
  { id: "completed", label: "완료" },
];

function filterProjects(projects: Project[], tab: FilterTab): Project[] {
  if (tab === "all") return projects;
  if (tab === "completed")
    return projects.filter((p) => p.status === "completed");
  return projects.filter(
    (p) =>
      p.status === "ready" ||
      p.status === "analyzing" ||
      p.status === "draft" ||
      p.status === "failed",
  );
}

interface ProjectsPageClientProps {
  initialProjects: Project[];
}

export function ProjectsPageClient({
  initialProjects,
}: ProjectsPageClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const projects = useMemo(
    () => filterProjects(initialProjects, activeTab),
    [initialProjects, activeTab],
  );

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
          onClick={() => setModalOpen(true)}
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
          <p className="text-gray-500">
            {initialProjects.length === 0
              ? "아직 프로젝트가 없습니다. 새 프로젝트를 만들어 보세요."
              : "해당 조건의 프로젝트가 없습니다."}
          </p>
          {initialProjects.length === 0 && (
            <Button
              className="mt-4"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden />새 프로젝트 생성
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
