import { cn } from "@/lib/utils/cn";
import type { ProjectStatus } from "@/types/project";

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  draft: { label: "초안", className: "bg-gray-100 text-gray-700" },
  ready: { label: "분석 가능", className: "bg-blue-50 text-blue-700" },
  analyzing: { label: "분석 중", className: "bg-amber-50 text-amber-700" },
  completed: { label: "완료", className: "bg-green-50 text-green-700" },
  failed: { label: "실패", className: "bg-red-50 text-red-700" },
};

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: statusClass } = statusConfig[status];

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
