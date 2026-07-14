-- ============================================================
-- Migration: إضافة المقاسات والألوان للمنتجات والطلبات
-- ============================================================

-- إضافة أعمدة المقاسات والألوان لجدول المنتجات
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';

-- إضافة أعمدة المقاس واللون المختارين لجدول الطلبات
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "selectedSize" TEXT,
  ADD COLUMN IF NOT EXISTS "selectedColor" TEXT;