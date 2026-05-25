# 09. E2E 테스트 체크리스트 (Phase 8)

> **목적:** 업로드 → AI 파싱 → 테이블 편집 → 엑셀 Export까지 **전체 사용자 흐름**을 로컬 또는 Vercel 프로덕션에서 검증합니다.

---

## 사전 조건

- [ ] Supabase에 [08_new_schema_migration.sql](./08_new_schema_migration.sql) 실행 완료
- [ ] Supabase에 [09_meeting_room_columns_migration.sql](./09_meeting_room_columns_migration.sql) 실행 완료
- [ ] Storage 버킷 `project-files` (Private) 생성
- [ ] `.env.local` (로컬) 또는 Vercel 환경 변수 설정 완료
- [ ] `npm run build` 성공

### 필수 환경 변수 (Vercel 포함)

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage 다운로드 (파싱 API) |
| `OPENAI_API_KEY` | AI 파싱 |
| `NEXT_PUBLIC_SITE_URL` | Auth 콜백 URL |

선택: `OPENAI_PARSE_MODEL` (기본 `gpt-4o-mini`)

---

## 1. 로그인 · 프로젝트 생성

| # | 단계 | 기대 결과 | ✓ |
|---|------|-----------|---|
| 1.1 | `/login` 접속 → 이메일 로그인 | 대시보드(`/`)로 이동 | |
| 1.2 | **새 프로젝트** 생성 | 프로젝트 목록에 표시 | |
| 1.3 | 프로젝트 클릭 → `/projects/[id]` | 업로드 패널 + 빈 테이블 영역 | |

---

## 2. 파일 업로드

| # | 단계 | 기대 결과 | ✓ |
|---|------|-----------|---|
| 2.1 | `.xlsx` 또는 `.csv` 드래그앤드롭 | 업로드 성공, 파일 목록 표시 | |
| 2.2 | 10MB 초과 파일 시도 | 한국어 오류 메시지 | |
| 2.3 | `.xls` 등 미지원 형식 | 거부 + 안내 | |

---

## 3. AI 파싱 (업로드 시 자동 + 재파싱 버튼)

| # | 단계 | 기대 결과 | ✓ |
|---|------|-----------|---|
| 3.1 | `.xlsx` 업로드 | "업로드 중" → **자동** "AI 파싱 중" 표시 | |
| 3.2 | 파싱 완료 | 성공 메시지 + 테이블에 회의실명·자재비·재료비·노무비 컬럼 | |
| 3.3 | **AI 파싱** 버튼 재클릭 | 동일 파일 재추출 (기존 행 삭제 후 재INSERT) | |
| 3.4 | 페이지 새로고침 | 동일 데이터 유지 (DB 저장 확인) | |
| 3.5 | `OPENAI_API_KEY` 미설정 시 | 한국어 오류 안내 | |
| 3.6 | Supabase `estimate_items` | `room_name`, `material_cost_*` 등 새 컬럼 값 확인 | |

---

## 4. 테이블 편집 (CRUD)

| # | 단계 | 기대 결과 | ✓ |
|---|------|-----------|---|
| 4.1 | 셀 수정 후 blur | 자동 저장, **수정** 뱃지 표시 | |
| 4.2 | **행 추가** | 새 행 생성, 편집 가능 | |
| 4.3 | 행 선택 → **선택 삭제** | 선택 행 제거 | |
| 4.4 | 검색·공종 필터 | 필터링 동작 | |
| 4.5 | 새로고침 | 수정·추가·삭제 반영 유지 | |

---

## 5. 엑셀 Export

| # | 단계 | 기대 결과 | ✓ |
|---|------|-----------|---|
| 5.1 | **엑셀 Export** 클릭 | `.xlsx` 다운로드 | |
| 5.2 | 파일명 | `{프로젝트명}_Export_{YYYYMMDD}.xlsx` | |
| 5.3 | Excel에서 열기 | 회의실명·자재비·재료비·노무비·비고 + 합계 행 확인 | |
| 5.4 | 테이블 수정 후 재-Export | 수정 값 반영 | |
| 5.5 | 항목 0건일 때 Export | 버튼 비활성 또는 오류 안내 | |

---

## 6. 보안 (RLS)

| # | 단계 | 기대 결과 | ✓ |
|---|------|-----------|---|
| 6.1 | **다른 계정**으로 로그인 | 타 사용자 프로젝트 URL 접근 시 404 또는 차단 | |
| 6.2 | API 직접 호출 (`/api/projects/{타인id}/items`) | 401/404 | |

---

## 7. Vercel 프로덕션 배포

| # | 단계 | 기대 결과 | ✓ |
|---|------|-----------|---|
| 7.1 | GitHub에 최신 코드 push | Vercel 자동 빌드 시작 | |
| 7.2 | Vercel Deploy 성공 | 프로덕션 URL 접속 가능 | |
| 7.3 | 위 1~5 항목을 **프로덕션 URL**에서 반복 | 동일하게 동작 | |

### Vercel 환경 변수 확인

Vercel Dashboard → Project → **Settings** → **Environment Variables**

로컬 `.env.local`과 동일한 5~6개 변수가 **Production**에 등록되어 있어야 합니다.

코드 push 후: **Deployments** → 최신 배포 → **Visit**

프로덕션 URL 예: https://excel-analysis-ecru.vercel.app

---

## 문제 발생 시

| 증상 | 확인 사항 |
|------|-----------|
| 업로드 실패 | Storage 버킷 `project-files`, `SUPABASE_SERVICE_ROLE_KEY` on Vercel |
| 파싱 실패 | `OPENAI_API_KEY`, 마이그레이션 SQL 실행 여부 |
| 테이블 빈 상태 | `estimate_items` 테이블 존재, RLS 정책 |
| Export 빈 파일/오류 | 항목 0건 여부, 빌드 로그 |
| 로그인 후 리다이렉트 오류 | `NEXT_PUBLIC_SITE_URL` = 실제 배포 URL |

자세한 트러블슈팅: [07_environment_setup_guide.md](./07_environment_setup_guide.md) 10절
