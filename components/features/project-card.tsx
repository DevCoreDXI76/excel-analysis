import Link from "next/link";
import { FileSpreadsheet, ChevronRight } from "lucide-react";
import type { Project } from "@/types/project";
import { StatusBadge } from "@/components/ui/status-badge";

interface ProjectCardProps {
  project: Project;
}

function formatDate(iso: string): string {
  try {
    return iso.slice(0, 10);
  } catch {
    return iso;
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <FileSpreadsheet
              className="h-5 w-5 text-blue-600"
              aria-hidden
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
              {project.name}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatDate(project.updatedAt)} 업데이트
            </p>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-600">
          {project.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-500">
          파일 {project.fileCount}개
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
          열기
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
