import { redirect } from "next/navigation";

/** 구버전 업로드 URL → 워크스페이스로 리다이렉트 */
export default function UploadRedirectPage() {
  redirect("/projects/1");
}
