# AI 엑셀 자동 분석 시스템

공사·견적 엑셀(`.xlsx`) 또는 CSV(`.csv`)를 업로드하면 OpenAI **Structured Output**으로 항목을 추출하고, Supabase DB에 저장한 뒤 웹 표에서 **편집·검증**하고 **회사 양식 엑셀로 Export**할 수 있는 웹 서비스입니다.

## 주요 기능

| 단계 | 설명 |
|------|------|
| 업로드 | `.xlsx` / `.csv` → Supabase Storage |
| AI 파싱 | OpenAI JSON Schema → `estimate_items` DB 저장 |
| 테이블 편집 | 인라인 수정, 행 추가·삭제, 검색·필터 |
| 엑셀 Export | DB 최신값 → 회사 양식 `.xlsx` 다운로드 |

## 기술 스택

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** (Auth, PostgreSQL, Storage, RLS)
- **OpenAI Chat Completions** (Structured Output 파싱)
- **SheetJS (`xlsx`)** — 업로드 전처리·Export 생성
- **Vercel** 배포

## 사전 준비

- [Node.js](https://nodejs.org/) 20 LTS 이상
- [Supabase](https://supabase.com/) 프로젝트
- [OpenAI](https://platform.openai.com/) API 키

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env.local`을 만들고, 본인 계정에서 발급한 키를 입력합니다.

```bash
copy .env.example .env.local
```

> `.env.local`은 Git에 커밋하지 마세요.

### 3. Supabase DB 마이그레이션

Supabase Dashboard → **SQL Editor**에서 [docs/08_new_schema_migration.sql](./docs/08_new_schema_migration.sql) 전체를 실행합니다.

Storage 버킷 `project-files` (Private)가 있어야 합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## 배포 (Vercel)

1. GitHub에 코드 push
2. Vercel에서 저장소 Import (또는 기존 프로젝트 연결)
3. `.env.local`과 **동일한 환경 변수**를 Vercel에 등록
4. Deploy 후 `NEXT_PUBLIC_SITE_URL`을 실제 배포 URL로 설정하고 Redeploy

자세한 Step-by-Step: [docs/07_environment_setup_guide.md](./docs/07_environment_setup_guide.md)

E2E 테스트 체크리스트: [docs/09_e2e_checklist.md](./docs/09_e2e_checklist.md)

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |

## 프로젝트 구조

```
app/                    # 페이지 + API Route
  api/projects/[id]/    # upload, parse, items, export
components/features/    # 업로드, 테이블, 파싱, Export UI
lib/
  excel/                # xlsx 읽기·Export 생성
  openai/               # Structured Output 파싱
  data/                 # Supabase 조회 헬퍼
types/                  # estimate-item, project, parse-job
docs/                   # 설계·로드맵·가이드
```

## 문서

- [시스템 아키텍처](./docs/01_system_architecture.md)
- [기술 스택](./docs/02_tech_stack.md)
- [개발 계획](./docs/03_development_plan.md)
- [코딩 가이드라인](./docs/04_coding_guideline.md)
- [DB 스키마](./docs/06_database_schema.md)
- [환경 설정 및 외부 연동](./docs/07_environment_setup_guide.md)
- [DB 마이그레이션 SQL](./docs/08_new_schema_migration.sql)
- [E2E 테스트 체크리스트](./docs/09_e2e_checklist.md)

## 프로덕션 URL

https://excel-analysis-ecru.vercel.app
