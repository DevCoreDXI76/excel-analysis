-- ============================================================
-- AI 엑셀 자동 분석 시스템 — v2 스키마 마이그레이션
-- docs/06_database_schema.md 기준
-- ============================================================
--
-- [실행 방법]
--   1. Supabase Dashboard → SQL Editor → New query
--   2. 이 파일 내용 전체를 복사하여 붙여넣기
--   3. Run 클릭
--
-- [주의 — 반드시 읽으세요]
--   - analysis_runs, analysis_results 테이블과 그 안의 데이터가 삭제됩니다.
--   - projects.openai_thread_id, project_files.openai_file_id 컬럼이 삭제됩니다.
--   - profiles, projects, project_files, file_sheets 기존 데이터는 유지됩니다.
--   - 실행 전 Supabase Table Editor에서 중요 데이터를 백업하세요.
--
-- [적용 후 확인]
--   - parse_jobs, estimate_items 테이블 생성 여부
--   - SELECT count(*) FROM estimate_items; (초기에는 0)
-- ============================================================

BEGIN;

-- ─── 1. 구 아키텍처 테이블 삭제 (AI 채팅/리포트) ───────────────
-- analysis_results가 analysis_runs를 참조하므로 순서 중요

DROP TABLE IF EXISTS public.analysis_results CASCADE;
DROP TABLE IF EXISTS public.analysis_runs CASCADE;

-- ─── 2. projects 컬럼 정리 ───────────────────────────────────

-- Assistants API 채팅 Thread ID (폐기)
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS openai_thread_id;

-- status CHECK 제약 갱신 (analyzing/completed → parsing/parsed)
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

UPDATE public.projects
SET status = CASE
  WHEN status = 'analyzing' THEN 'parsing'
  WHEN status = 'completed' THEN 'parsed'
  WHEN status IN ('draft', 'ready', 'parsing', 'parsed', 'failed') THEN status
  ELSE 'ready'
END;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'ready', 'parsing', 'parsed', 'failed'));

COMMENT ON COLUMN public.projects.status IS
  'draft=생성직후 | ready=파일있음 | parsing=AI파싱중 | parsed=파싱완료 | failed=실패';

-- ─── 3. project_files 컬럼 정리 ────────────────────────────────

-- OpenAI Files API ID (폐기)
ALTER TABLE public.project_files
  DROP COLUMN IF EXISTS openai_file_id;

-- 파일별 파싱 상태
ALTER TABLE public.project_files
  ADD COLUMN IF NOT EXISTS parse_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.project_files
  DROP CONSTRAINT IF EXISTS project_files_parse_status_check;

ALTER TABLE public.project_files
  ADD CONSTRAINT project_files_parse_status_check
  CHECK (parse_status IN ('pending', 'parsing', 'parsed', 'failed'));

COMMENT ON COLUMN public.project_files.parse_status IS
  'pending=업로드만 | parsing=파싱중 | parsed=완료 | failed=실패';

-- ─── 4. 헬퍼 함수 (RLS용) ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_project_owner IS
  'RLS 정책: 현재 로그인 사용자가 프로젝트 소유자인지 확인';

-- ─── 5. parse_jobs (AI 파싱 실행 이력) ───────────────────────

CREATE TABLE IF NOT EXISTS public.parse_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.project_files(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  model TEXT,
  rows_extracted INT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parse_jobs_project_id
  ON public.parse_jobs(project_id);

CREATE INDEX IF NOT EXISTS idx_parse_jobs_file_id
  ON public.parse_jobs(file_id);

COMMENT ON TABLE public.parse_jobs IS
  'AI 구조화 파싱 실행 1회 = 1건 (파일 단위)';

-- ─── 6. estimate_items (핵심 — 엑셀 1행 = 1레코드) ───────────

CREATE TABLE IF NOT EXISTS public.estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.project_files(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  source_row_index INT,
  category TEXT,
  item_name TEXT,
  specification TEXT,
  manufacturer TEXT,
  quantity NUMERIC,
  unit TEXT,
  unit_price NUMERIC,
  total_amount NUMERIC,
  remark TEXT,
  extra_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_manually_edited BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimate_items_project_id
  ON public.estimate_items(project_id);

CREATE INDEX IF NOT EXISTS idx_estimate_items_file_id
  ON public.estimate_items(file_id);

CREATE INDEX IF NOT EXISTS idx_estimate_items_item_name
  ON public.estimate_items(item_name);

COMMENT ON TABLE public.estimate_items IS
  'AI가 추출한 견적/내역 항목 — 웹 테이블·엑셀 Export의 원본 데이터';

COMMENT ON COLUMN public.estimate_items.item_name IS '품명';
COMMENT ON COLUMN public.estimate_items.specification IS '규격';
COMMENT ON COLUMN public.estimate_items.manufacturer IS '제조사';
COMMENT ON COLUMN public.estimate_items.category IS '공종';
COMMENT ON COLUMN public.estimate_items.extra_fields IS '매핑되지 않은 추가 컬럼 (JSON)';

-- estimate_items updated_at 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estimate_items_updated_at ON public.estimate_items;

CREATE TRIGGER estimate_items_updated_at
  BEFORE UPDATE ON public.estimate_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 7. RLS 활성화 ───────────────────────────────────────────

ALTER TABLE public.parse_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;

-- ─── 8. RLS 정책: parse_jobs ─────────────────────────────────

DROP POLICY IF EXISTS "parse_jobs_all_via_project" ON public.parse_jobs;

CREATE POLICY "parse_jobs_all_via_project"
  ON public.parse_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = parse_jobs.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = parse_jobs.project_id AND p.user_id = auth.uid()
    )
  );

-- ─── 9. RLS 정책: estimate_items ─────────────────────────────

DROP POLICY IF EXISTS "estimate_items_all_via_project" ON public.estimate_items;

CREATE POLICY "estimate_items_all_via_project"
  ON public.estimate_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = estimate_items.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = estimate_items.project_id AND p.user_id = auth.uid()
    )
  );

COMMIT;

-- ─── 10. 검증 쿼리 (실행 후 결과 확인) ────────────────────────
-- 아래 SELECT는 오류 없이 실행되면 마이그레이션 성공입니다.

SELECT 'parse_jobs' AS table_name, count(*) AS row_count FROM public.parse_jobs
UNION ALL
SELECT 'estimate_items', count(*) FROM public.estimate_items
UNION ALL
SELECT 'projects', count(*) FROM public.projects
UNION ALL
SELECT 'project_files', count(*) FROM public.project_files;
