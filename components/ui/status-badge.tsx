import { cn } from "@/lib/utils/cn";
import type { ProjectStatus } from "@/types/project";

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  draft: { label: "초안", className: "bg-gray-100 text-gray-700" },
  ready: { label: "파싱 가능", className: "bg-blue-50 text-blue-700" },
  parsing: { label: "파싱 중", className: "bg-amber-50 text-amber-700" },
  parsed: { label: "파싱 완료", className: "bg-green-50 text-green-700" },
  failed: { label: "실패", className: "bg-red-50 text-red-700" },
};

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.draft;
  const { label, className: statusClass } = config;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
