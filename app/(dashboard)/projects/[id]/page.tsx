import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FileUploadPanel } from "@/components/features/file-upload-panel";
import { EstimateItemsTable } from "@/components/features/estimate-items-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getEstimateItemsByProjectId } from "@/lib/data/estimate-items";
import { getProjectById } from "@/lib/data/projects";

interface ProjectWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectWorkspacePage({
  params,
}: ProjectWorkspacePageProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const items = await getEstimateItemsByProjectId(project.id);

  const itemsKey =
    items.length > 0
      ? items.map((i) => `${i.id}:${i.updatedAt}`).join("|")
      : "empty";

  return (
    <div className="flex h-full min-h-screen flex-col p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />내 프로젝트
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.description && (
          <p className="mt-1 text-sm text-gray-600">{project.description}</p>
        )}
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <FileUploadPanel projectId={project.id} files={project.files} />
        <EstimateItemsTable
          key={itemsKey}
          projectId={project.id}
          initialItems={items}
          hasFiles={project.files.length > 0}
          defaultFileId={project.files[0]?.id ?? null}
        />
      </div>
    </div>
  );
}
