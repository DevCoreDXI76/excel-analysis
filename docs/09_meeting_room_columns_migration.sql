-- ============================================================
-- 회의실 견적 전용 컬럼 추가 (estimate_items)
-- docs/08_new_schema_migration.sql 실행 후 적용
-- ============================================================
--
-- [실행 방법]
--   Supabase Dashboard → SQL Editor → New query → Run
--
-- [추가 컬럼]
--   room_name, supplied_product,
--   material_cost_unit/total, ingredient_cost_unit/total,
--   labor_cost_unit/total
-- ============================================================

BEGIN;

ALTER TABLE public.estimate_items
  ADD COLUMN IF NOT EXISTS room_name TEXT,
  ADD COLUMN IF NOT EXISTS supplied_product TEXT,
  ADD COLUMN IF NOT EXISTS material_cost_unit NUMERIC,
  ADD COLUMN IF NOT EXISTS material_cost_total NUMERIC,
  ADD COLUMN IF NOT EXISTS ingredient_cost_unit NUMERIC,
  ADD COLUMN IF NOT EXISTS ingredient_cost_total NUMERIC,
  ADD COLUMN IF NOT EXISTS labor_cost_unit NUMERIC,
  ADD COLUMN IF NOT EXISTS labor_cost_total NUMERIC;

COMMENT ON COLUMN public.estimate_items.room_name IS '회의실명';
COMMENT ON COLUMN public.estimate_items.supplied_product IS '공급 제품';
COMMENT ON COLUMN public.estimate_items.material_cost_unit IS '자재비 단가';
COMMENT ON COLUMN public.estimate_items.material_cost_total IS '자재비 합계';
COMMENT ON COLUMN public.estimate_items.ingredient_cost_unit IS '재료비 단가';
COMMENT ON COLUMN public.estimate_items.ingredient_cost_total IS '재료비 합계';
COMMENT ON COLUMN public.estimate_items.labor_cost_unit IS '노무비 단가';
COMMENT ON COLUMN public.estimate_items.labor_cost_total IS '노무비 합계';

CREATE INDEX IF NOT EXISTS idx_estimate_items_room_name
  ON public.estimate_items(room_name);

COMMIT;

-- 검증
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'estimate_items'
  AND column_name IN (
    'room_name', 'supplied_product',
    'material_cost_unit', 'material_cost_total',
    'ingredient_cost_unit', 'ingredient_cost_total',
    'labor_cost_unit', 'labor_cost_total'
  )
ORDER BY column_name;
