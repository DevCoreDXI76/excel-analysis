# AI 엑셀 자동 분석 및 시각화 웹 서비스

엑셀(`.xlsx`) 또는 CSV(`.csv`) 파일을 업로드하면 OpenAI Code Interpreter가 데이터를 분석하고, 요약·차트를 생성하는 웹 서비스입니다.

## 기술 스택

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** (PostgreSQL, Storage)
- **OpenAI Assistants API** (Code Interpreter)
- **Vercel** 배포 예정

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

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## 외부 서비스 연동 (GitHub · Supabase · Vercel)

GitHub 업로드, Supabase·OpenAI 키 설정, Vercel 배포까지 **Step-by-Step** 가이드:

**[docs/07_environment_setup_guide.md](./docs/07_environment_setup_guide.md)**

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |

## 프로젝트 구조

```
app/           # 페이지 + API Route
components/    # UI 컴포넌트 (ui/, features/)
lib/           # Supabase, OpenAI, 유틸
types/         # TypeScript 타입
hooks/         # 커스텀 React 훅
docs/          # 프로젝트 문서
```

## 문서

자세한 설계·로드맵·코딩 규칙은 [docs/](./docs/) 폴더를 참고하세요.

- [시스템 아키텍처](./docs/01_system_architecture.md)
- [기술 스택](./docs/02_tech_stack.md)
- [개발 계획](./docs/03_development_plan.md)
- [코딩 가이드라인](./docs/04_coding_guideline.md)
- [환경 설정 및 외부 연동](./docs/07_environment_setup_guide.md)
