import { getProjects } from "@/lib/data/projects";
import { ProjectsPageClient } from "@/components/features/projects-page-client";

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsPageClient initialProjects={projects} />;
}
