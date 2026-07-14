// ============================================================
// طبقة تتبع موحّدة — القاعدة الذهبية:
// هذا الملف هو المكان الوحيد في كامل المشروع الذي يتعامل مع
// dataLayer أو Meta. لا يوجد أي fbq() مباشر في أي صفحة أخرى.
// هذا يمنع تكرار الأحداث (كما حدث سابقًا) ويجعل الصيانة أسهل.
// ============================================================

import { supabase } from "./supabase";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/** توليد معرّف فريد لكل حدث — يُستخدم لمنع التكرار بين GTM وCAPI */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/** قراءة كوكيز Meta القياسية للمطابقة (يضعها بكسل GTM تلقائيًا) */
function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getMetaCookies() {
  return {
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
  };
}

/** دفع حدث نظيف إلى dataLayer — GTM يقرأ من هنا فقط */
export function pushDataLayerEvent(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

/** استدعاء Edge Function لإرسال الحدث عبر CAPI من طرف السيرفر */
async function sendServerEvent(params: {
  event_name: "Lead" | "Purchase";
  event_id: string;
  value: number;
  phone?: string;
  name?: string;
}) {
  const { fbp, fbc } = getMetaCookies();
  try {
    // ملاحظة: supabase.functions.invoke() يُرسل مفتاح anon key تلقائيًا
    // في Authorization header. Edge Function تتحقق من هذا افتراضيًا
    // (verify_jwt)، ولسنا بحاجة لإرسال أي رمز سري إضافي هنا — حدث Lead
    // من زبون حقيقي يتصفح الموقع أمر متوقع وسليم.
    await supabase.functions.invoke("meta-capi", {
      body: {
        ...params,
        currency: "DZD",
        fbp,
        fbc,
        user_agent: navigator.userAgent,
        event_source_url: window.location.href,
      },
    });
  } catch (err) {
    // لا نُفشل عملية الطلب بسبب خطأ تتبع — فقط نُسجّله
    console.error("CAPI Lead event failed silently:", err);
  }
}

/** ViewContent — استدعِها عند تحميل صفحة منتج */
export function trackViewContent(product: { id: string; name: string; price: number }) {
  pushDataLayerEvent("view_item", {
    event_id: generateEventId(),
    currency: "DZD",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, price: product.price }],
  });
}

/**
 * Lead — استدعِها فور نجاح إدخال الطلب في قاعدة البيانات.
 * تُطلق الحدث في المتصفح (لـ GTM) وفي السيرفر (CAPI) بنفس eventId
 * الذي مرّرته أنت — يجب أن يكون نفس المعرّف المحفوظ مع الطلب.
 */
export function trackLead(params: {
  eventId: string;
  value: number;
  phone: string;
  name: string;
}): void {
  pushDataLayerEvent("generate_lead", {
    event_id: params.eventId,
    currency: "DZD",
    value: params.value,
    // ملاحظة: لا نضع الاسم/الهاتف الخام هنا — GTM يجب أن يقرأ
    // فقط ما يحتاجه Advanced Matching، ونُبقي البيانات الحساسة
    // في مسار CAPI المشفّر بدل الاعتماد على dataLayer العلني.
  });

  sendServerEvent({
    event_name: "Lead",
    event_id: params.eventId,
    value: params.value,
    phone: params.phone,
    name: params.name,
  });
}
