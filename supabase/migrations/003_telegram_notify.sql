-- ============================================================
-- Migration: إشعارات تيليغرام عند إنشاء طلب جديد
-- ============================================================
-- هذا الملف يضيف trigger يُرسل إشعارًا إلى بوت تيليغرام
-- عند إدراج طلب جديد في جدول orders.
--
-- المتطلبات:
--   1. نشر Edge Function: telegram-notify
--   2. تفعيل extension pg_net إن لم يكن مفعّلاً
--   3. ضبط الإعدادات التالية من SQL Editor:
--
--   ALTER DATABASE postgres SET app.settings.telegram_function_url TO
--     'https://<project-ref>.supabase.co/functions/v1/telegram-notify';
--   ALTER DATABASE postgres SET app.settings.service_role_key TO
--     '<service_role_key>';
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_telegram_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_function_url TEXT;
  v_service_key TEXT;
BEGIN
  v_function_url := current_setting('app.settings.telegram_function_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  IF v_function_url IS NOT NULL AND v_service_key IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object(
          'orderId', NEW.id,
          'customerName', NEW."customerName",
          'customerPhone', NEW."customerPhone",
          'customerWilaya', NEW."customerWilaya",
          'productName', NEW."productName",
          'quantity', NEW.quantity,
          'totalAmount', NEW."totalAmount",
          'selectedSize', NEW."selectedSize",
          'selectedColor', NEW."selectedColor",
          'address', NEW."customerAddress",
          'createdAt', NEW."createdAt"
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'فشل إرسال إشعار تيليغرام: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING 'إعدادات تيليغرام غير مُهيأة — راجع ملف الترحيل 003_telegram_notify.sql';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_telegram_on_new_order ON orders;
CREATE TRIGGER trg_notify_telegram_on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_telegram_on_new_order();