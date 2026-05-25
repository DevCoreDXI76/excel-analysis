# 04. 코딩 가이드라인

> **이 문서를 읽으면 알 수 있는 것**
>
> - 이 프로젝트에서 코드를 작성할 때 지켜야 할 **규칙과 습관**
> - 폴더 구조, 네이밍, 주석, API·컴포넌트 작성 방식
> - AI( Cursor )와 사람 모두가 **같은 스타일**로 코드를 유지하기 위한 기준

---

## 목차

1. [기본 원칙](#1-기본-원칙)
2. [프로젝트 디렉토리 구조](#2-프로젝트-디렉토리-구조)
3. [네이밍 컨벤션](#3-네이밍-컨벤션)
4. [TypeScript 규칙](#4-typescript-규칙)
5. [React / Next.js 규칙](#5-react--nextjs-규칙)
6. [주석 작성 규칙](#6-주석-작성-규칙)
7. [API Route 규칙](#7-api-route-규칙)
8. [Supabase / OpenAI 사용 규칙](#8-supabase--openai-사용-규칙)
9. [스타일 (Tailwind) 규칙](#9-스타일-tailwind-규칙)
10. [Git 커밋 규칙](#10-git-커밋-규칙)
11. [금지 사항](#11-금지-사항)
12. [코드 리뷰 체크리스트](#12-코드-리뷰-체크리스트)

---

## 1. 기본 원칙

| 원칙 | 설명 |
|------|------|
| **읽기 쉬운 코드** | "영리한" 코드보다 팀(또는 미래의 나)이 이해하기 쉬운 코드 |
| **작은 단위** | 한 파일·한 함수는 한 가지 일만 |
| **서버 우선** | API 키·민감 로직은 서버; 클라이언트는 최소 권한 |
| **타입 우선** | `any` 지양, 공통 타입은 `types/`에 정의 |
| **일관성** | 기존 파일 스타일을 따르고, 새 패턴은 문서에 반영 |

---

## 2. 프로젝트 디렉토리 구조

```
Excel-Analysis/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/projects/[id]/
│   └── api/projects/[id]/
│       ├── upload/route.ts
│       ├── parse/route.ts
│       ├── items/route.ts
│       ├── items/[itemId]/route.ts
│       └── export/route.ts
├── components/
│   ├── ui/
│   └── features/
│       ├── file-upload-panel.tsx
│       ├── estimate-items-table.tsx
│       ├── parse-action-bar.tsx
│       └── export-button.tsx
├── lib/
│   ├── supabase/
│   ├── openai/
│   │   ├── client.ts
│   │   ├── parse.ts
│   │   └── schema.ts
│   ├── excel/
│   │   ├── extract-sheet-data.ts
│   │   └── build-export-workbook.ts
│   ├── data/
│   └── api/verify-project.ts
├── types/
│   ├── estimate-item.ts
│   ├── parse-job.ts
│   ├── project.ts
│   └── api.ts
├── docs/
├── .env.example
└── .env.local
```

### 폴더 역할 요약

| 폴더 | 넣을 것 | 넣지 말 것 |
|------|---------|------------|
| `app/` | 페이지, `route.ts` | 재사용 UI 컴포넌트 |
| `components/ui/` | 디자인만 있는 작은 UI | API 호출, 비즈니스 로직 |
| `components/features/` | 기능별 UI + 해당 훅 사용 | Supabase service role |
| `lib/` | 외부 서비스 클라이언트, 순수 유틸 | React 컴포넌트 |
| `types/` | 공유 TypeScript 타입/인터페이스 | 런타임 로직 |

---

## 3. 네이밍 컨벤션

### 3.1 파일·폴더

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | `kebab-case.tsx` | `file-uploader.tsx` |
| 유틸·lib | `kebab-case.ts` | `format.ts` |
| 타입 파일 | `kebab-case.ts` | `estimate-item.ts` |
| App Router 페이지 | `page.tsx`, `layout.tsx` | `app/upload/page.tsx` |
| API Route | `route.ts` | `app/api/upload/route.ts` |

### 3.2 코드 식별자

| 대상 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 | `PascalCase` | `FileUploader` |
| 함수·변수 | `camelCase` | `uploadFile`, `sessionId` |
| 상수 | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| 타입·인터페이스 | `PascalCase` | `EstimateItem` |
| DB 테이블·컬럼 | `snake_case` | `analysis_sessions`, `created_at` |
| 환경 변수 | `UPPER_SNAKE_CASE` | `OPENAI_API_KEY` |

### 3.3 이벤트 핸들러

```tsx
// props: on + 동사 (콜백)
onUploadComplete?: (sessionId: string) => void;

// 내부 핸들러: handle + 대상 + 동사
const handleFileSelect = (files: File[]) => { ... };
```

---

## 4. TypeScript 규칙

### 4.1 `any` 금지 (예외 시 주석)

```typescript
// ❌ 나쁜 예
function parseData(data: any) { ... }

// ✅ 좋은 예
function parseData(data: unknown): AnalysisResult {
  // zod 등으로 검증 후 사용
}
```

### 4.2 공통 타입은 `types/`에

```typescript
// types/estimate-item.ts

/** DB estimate_items 테이블과 1:1 대응 */
export interface EstimateItem {
  id: string;
  projectId: string;
  itemName: string | null;
  quantity: number | null;
  unitPrice: number | null;
  isManuallyEdited: boolean;
  // ...
}
```

### 4.3 API 응답 타입 명시

```typescript
// types/api.ts
export interface UploadResponse {
  fileId: string;
  fileName: string;
}

export interface ApiErrorResponse {
  error: string;
}
```

---

## 5. React / Next.js 규칙

### 5.1 Server Component vs Client Component

| Server Component (기본) | Client Component (`'use client'`) |
|-------------------------|-----------------------------------|
| DB 직접 조회 | `useState`, `useEffect` |
| SEO·초기 HTML | 클릭, 드래그앤드롭 |
| API 키 사용 가능 | 브라우저 이벤트 |

**규칙:** `'use client'`는 **필요한 파일 최하단 leaf**에만 붙입니다.

```tsx
// app/analysis/[id]/page.tsx — Server Component
import { AnalysisReport } from '@/components/features/analysis-report';

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  // 서버에서 데이터 fetch (Phase 3 이후)
  return <AnalysisReport sessionId={params.id} />;
}
```

### 5.2 컴포넌트 분리 기준

- **200줄 초과** → 하위 컴포넌트 또는 훅으로 분리
- **페이지(`page.tsx`)** → 레이아웃 조합 + 데이터 fetch만
- **같은 파일에 UI + API 호출 + 복잡 상태** → `features/` + `hooks/`로 분리

### 5.3 import 순서

```tsx
// 1. React / Next
import { useState } from 'react';
import Link from 'next/link';

// 2. 외부 라이브러리
import { useDropzone } from 'react-dropzone';

// 3. 내부 absolute (@/)
import { Button } from '@/components/ui/button';
import type { EstimateItem } from '@/types/estimate-item';

// 4. 상대 경로 (같은 feature 내부)
import { UploadIcon } from './upload-icon';
```

---

## 6. 주석 작성 규칙

### 6.1 언어

- **한국어**로 작성 (비개발자·국내 팀 협업 기준)
- 사용자에게 보이는 UI 문구도 한국어

### 6.2 무엇을 주석으로 남길까

| 주석 O | 주석 X |
|--------|--------|
| 비즈니스 규칙 ("왜 10MB 제한인지") | `i++` 같은 자명한 코드 |
| OpenAI 파싱 타임아웃 | 모든 함수에 `@param` 남발 |
| RLS·보안 관련 주의 | 코드와 다른 오래된 주석 |

### 6.3 JSDoc 예시

```typescript
/**
 * Storage에서 다운로드한 xlsx 버퍼를 시트별 행 JSON으로 변환합니다.
 * AI 파싱 API에서 OpenAI에 전달하기 전 전처리에 사용합니다.
 */
export function extractSheetDataFromBuffer(buffer: Buffer, fileName: string) {
  // ...
}
```

### 6.4 섹션 구분 (긴 파일)

```typescript
// ─── 상수 ─────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── 업로드 검증 ───────────────────────────────
function validateFile(file: File): void { ... }
```

---

## 7. API Route 규칙

### 7.1 기본 구조

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/** 허용 MIME 타입 */
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
] as const;

export async function POST(request: NextRequest) {
  try {
    // 1. 입력 검증
    // 2. 비즈니스 로직
    // 3. 성공 응답
    return NextResponse.json({ sessionId: '...', fileName: '...' });
  } catch (error) {
    console.error('[POST /api/upload]', error);
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

### 7.2 에러 응답 형식 (통일)

```typescript
// 성공
{ "sessionId": "uuid", "fileName": "sales.xlsx" }

// 실패
{ "error": "사용자에게 보여줄 한국어 메시지" }
```

HTTP 상태 코드:

| 코드 | 용도 |
|------|------|
| 400 | 잘못된 요청 (파일 형식, 필드 누락) |
| 404 | 세션 없음 |
| 500 | 서버/OpenAI/Supabase 오류 |

### 7.3 zod 검증

```typescript
const ParseBodySchema = z.object({
  fileId: z.string().uuid().optional(),
});

const body = ParseBodySchema.safeParse(await request.json());
if (!body.success) {
  return NextResponse.json(
    { error: body.error.errors[0]?.message ?? '잘못된 요청입니다.' },
    { status: 400 }
  );
}
```

---

## 8. Supabase / OpenAI 사용 규칙

### 8.1 클라이언트 분리

| 파일 | 키 | 사용 위치 |
|------|-----|-----------|
| `lib/supabase/client.ts` | `NEXT_PUBLIC_*` anon | 브라우저 (제한적) |
| `lib/supabase/server.ts` | service role 또는 anon + cookie | Server Component, API Route |

**Service Role Key는 API Route에서만** Storage 업로드·DB 쓰기 등 서버 작업에 사용합니다.

### 8.2 OpenAI

- `OPENAI_API_KEY`는 **`lib/openai/` + API Route** 에서만 import
- 파싱: `lib/openai/parse.ts` — Chat Completions + JSON Schema
- Export: `lib/excel/build-export-workbook.ts` — DB 데이터 → xlsx (OpenAI 미사용)

```typescript
// ❌ 클라이언트 컴포넌트에서 openai 직접 호출 금지
'use client';
import OpenAI from 'openai'; // 금지
```

---

## 9. 스타일 (Tailwind) 규칙

### 9.1 `cn()` 유틸 사용

```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind 클래스 충돌을 merge */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
<Button className={cn('px-4 py-2', isDisabled && 'opacity-50 cursor-not-allowed')} />
```

### 9.2 디자인 토큰 (권장)

- Primary: `blue-600`, hover `blue-700`
- 배경: `gray-50`, 카드 `white`, border `gray-200`
- 에러: `red-600`, 성공: `green-600`

### 9.3 반응형

```tsx
<div className="px-4 md:px-8 lg:max-w-4xl lg:mx-auto">
```

---

## 10. Git 커밋 규칙

### 10.1 Conventional Commits (한국어 본문 가능)

```
feat: 업로드 API 및 Supabase Storage 연동
fix: CSV MIME 타입 검증 오류 수정
docs: 시스템 아키텍처 문서 추가
refactor: estimate-items 테이블 CRUD 분리
chore: eslint 설정 업데이트
```

### 10.2 커밋 단위

- 한 커밋 = **하나의 논리적 변경** (업로드 API만, UI만 등)
- `.env.local`, `node_modules` 커밋 금지

---

## 11. 금지 사항

| 금지 | 이유 |
|------|------|
| API 키를 클라이언트 번들에 포함 | 유출 시 과금·보안 사고 |
| `.env.local` Git 커밋 | 시크릿 노출 |
| 500줄짜리 단일 `page.tsx` | 유지보수 불가 |
| `any` 남용 | 타입 안전 상실 |
| 사용자에게 raw stack trace 표시 | UX·보안 |
| OpenAI 응답 무검증 DB 저장 | XSS·데이터 오염 (HTML 렌더 시 sanitize) |

---

## 12. 코드 리뷰 체크리스트

새 코드·PR 전에 아래를 확인합니다.

- [ ] TypeScript 빌드 에러 없음 (`npm run build`)
- [ ] ESLint 경고 없음 (`npm run lint`)
- [ ] API Route에 try/catch 및 통일된 `{ error }` 응답
- [ ] 시크릿이 `NEXT_PUBLIC_`에 없음
- [ ] 새 컴포넌트가 200줄 이하 또는 분리됨
- [ ] 복잡 로직에 한국어 JSDoc 또는 섹션 주석
- [ ] UI 문구 한국어, 에러 메시지 사용자 친화적

---

## 관련 문서

- [01_system_architecture.md](./01_system_architecture.md)
- [02_tech_stack.md](./02_tech_stack.md)
- [03_development_plan.md](./03_development_plan.md)
