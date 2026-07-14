-- ============================================================
-- Migration: إضافة أعمدة تتبع Meta للطلبات
-- الهدف: حفظ بيانات المطابقة (fbp/fbc) وقت إنشاء الطلب،
-- لأنها ستكون مطلوبة لاحقًا عند إرسال حدث Purchase عند التسليم
-- (وليس عند تأكيد الطلب) — دون هذا، تُفقد هذه البيانات للأبد
-- بمجرد إغلاق الزبون للصفحة.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS lead_event_id TEXT,
  ADD COLUMN IF NOT EXISTS purchase_event_id TEXT,
  ADD COLUMN IF NOT EXISTS fbp TEXT,
  ADD COLUMN IF NOT EXISTS fbc TEXT,
  ADD COLUMN IF NOT EXISTS client_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS purchase_sent_at TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- Trigger: عند تغيير حالة الطلب إلى 'delivered' لأول مرة فقط،
-- استدعِ Edge Function لإرسال حدث Purchase عبر CAPI تلقائيًا.
-- يعمل من طرف قاعدة البيانات مباشرة، لذا لا يعتمد على أن يبقى
-- المتصفح مفتوحًا أو أن يكتمل أي طلب من جهة الواجهة.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_purchase_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_function_url TEXT;
  v_service_key TEXT;
  v_purchase_secret TEXT;
BEGIN
  -- فقط عند الانتقال الفعلي إلى delivered لأول مرة (وليس أي تحديث آخر)
  IF NEW.status = 'delivered'
     AND (OLD.status IS DISTINCT FROM 'delivered')
     AND NEW.purchase_sent_at IS NULL THEN

    v_function_url := current_setting('app.settings.capi_function_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);
    v_purchase_secret := current_setting('app.settings.purchase_trigger_secret', true);

    -- لا نُطلق أي استدعاء إن لم تُهيَّأ الإعدادات بعد — ونُبقي
    -- عملية تحديث حالة الطلب تنجح بشكل طبيعي دون أي تأثير عليها
    IF v_function_url IS NOT NULL AND v_service_key IS NOT NULL AND v_purchase_secret IS NOT NULL THEN
      BEGIN
        PERFORM net.http_post(
          url := v_function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_key,
            'x-purchase-secret', v_purchase_secret
          ),
          body := jsonb_build_object(
            'event_name', 'Purchase',
            'order_id', NEW.id,
            'event_id', COALESCE(NEW.purchase_event_id, NEW.id::text || '-purchase'),
            'value', NEW."totalAmount",
            'currency', 'DZD',
            'phone', NEW."customerPhone",
            'name', NEW."customerName",
            'fbp', NEW.fbp,
            'fbc', NEW.fbc,
            'user_agent', NEW.client_user_agent
          )
        );
        NEW.purchase_sent_at := NOW();
      EXCEPTION WHEN OTHERS THEN
        -- أي خطأ في إرسال حدث Meta لا يجب أن يمنع تحديث حالة الطلب
        -- (مثلاً: مشكلة شبكة مؤقتة). فقط نُسجّل تحذيرًا في السجلات.
        RAISE WARNING 'فشل إرسال حدث Purchase لـ Meta: %', SQLERRM;
      END;
    ELSE
      RAISE WARNING 'إعدادات Meta CAPI غير مُهيأة بعد — راجع TRACKING_SETUP.md';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_purchase_on_delivery ON orders;
CREATE TRIGGER trg_notify_purchase_on_delivery
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_purchase_on_delivery();

-- ============================================================
-- بعد تشغيل هذا الملف، فعّل هذه الإعدادات الثلاثة من SQL Editor
-- (استبدل القيم بالفعلية بعد نشر Edge Function):
--
-- ALTER DATABASE postgres SET app.settings.capi_function_url =
--   'https://<project-ref>.supabase.co/functions/v1/meta-capi';
-- ALTER DATABASE postgres SET app.settings.service_role_key =
--   '<service_role key من Project Settings → API>';
-- ALTER DATABASE postgres SET app.settings.purchase_trigger_secret =
--   '<نفس PURCHASE_TRIGGER_SECRET المُعرَّف في أسرار Edge Function>';
--
-- ⚠️ service_role key له صلاحيات كاملة على قاعدة بياناتك بالكامل.
-- تخزينه هنا كإعداد على مستوى قاعدة البيانات آمن (لا يظهر لأي
-- عميل خارجي)، لكن لا تشاركه أبدًا في أي كود يصل للمتصفح.
--
-- ⚠️ تنويه: إن لم تُشغّل هذه الأسطر، الموقع وقاعدة البيانات
-- سيعملان بشكل طبيعي تمامًا — فقط لن يُرسَل حدث Purchase تلقائيًا
-- (سيظهر تحذير في Postgres Logs يذكّرك بذلك).
-- ============================================================
