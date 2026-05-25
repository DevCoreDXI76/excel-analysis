import { User, Bell, Shield } from "lucide-react";

const settingSections = [
  {
    icon: User,
    title: "프로필",
    description: "표시 이름, 역할(PM / 설계 / 영업) 설정",
    status: "Phase 3 — Supabase Auth 연동 완료",
  },
  {
    icon: Bell,
    title: "알림",
    description: "분석 완료, 오류 발생 시 이메일 알림",
    status: "준비 중",
  },
  {
    icon: Shield,
    title: "보안",
    description: "비밀번호 변경, 2단계 인증",
    status: "준비 중",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="mt-1 text-sm text-gray-600">
          계정 및 알림 설정을 관리합니다.
        </p>
      </div>

      <div className="max-w-2xl space-y-4">
        {settingSections.map(({ icon: Icon, title, description, status }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <Icon className="h-5 w-5 text-gray-600" aria-hidden />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
              <p className="mt-2 text-xs text-gray-400">{status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
