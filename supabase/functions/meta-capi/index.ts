// ============================================================
// Meta Conversions API Handler
// ============================================================
// نداء واحد موحّد لإرسال أي حدث (Lead أو Purchase) من طرف
// السيرفر إلى Meta، مع تشفير SHA256 الصحيح لبيانات المطابقة.
//
// من يستدعيها:
//   1. الموقع مباشرة بعد إنشاء الطلب → event_name: "Lead"
//   2. Trigger قاعدة البيانات عند status = 'delivered' → "Purchase"
//
// حماية: حدث Lead محمي بمصادقة Supabase التلقائية (anon key).
// حدث Purchase محمي إضافيًا برمز سري خاص (PURCHASE_TRIGGER_SECRET)
// لا يعرفه سوى الـ trigger في قاعدة البيانات — يمنع أي مستخدم
// عادي من حقن أحداث شراء وهمية.
// ============================================================

// @ts-nocheck - Deno Edge Function: imports and types resolved at runtime by Supabase
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const PIXEL_ID = Deno.env.get("META_PIXEL_ID")!;
const ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const PURCHASE_SECRET = Deno.env.get("PURCHASE_TRIGGER_SECRET")!;
const TEST_EVENT_CODE = Deno.env.get("META_TEST_EVENT_CODE"); // اختياري، فقط أثناء الاختبار

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, apikey, x-client-info, x-purchase-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// توحيد رقم الهاتف الجزائري لصيغة دولية قبل التشفير (متطلب Meta)
function normalizeAlgerianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0")) return "213" + digits.slice(1);
  return "213" + digits;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // ملاحظة أمان مهمة:
  // Supabase تتحقق تلقائيًا من صلاحية JWT (anon key أو service role)
  // قبل وصول الطلب لهذا الكود أصلاً (verify_jwt مفعّل افتراضيًا عند
  // النشر العادي). هذا كافٍ لحدث Lead — أي زبون حقيقي يتصفح الموقع
  // يحمل anon key الموجود أصلاً في كود الموقع العلني.
  //
  // لكن Purchase مختلف: يجب ألا يستطيع أي مستخدم عادي (حتى لو كان
  // يحمل anon key صالحًا) إرسال حدث Purchase مزيّف، لأن هذا يُفسد
  // بيانات التحسين لدى Meta. لذا نطلب رمزًا سريًا إضافيًا خاصًا
  // بـ Purchase، لا يعرفه سوى الـ trigger في قاعدة البيانات.
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (body.event_name === "Purchase") {
    const purchaseSecret = req.headers.get("x-purchase-secret");
    if (purchaseSecret !== PURCHASE_SECRET) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid purchase secret" }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }
  }

  try {
    const {
      event_name, // "Lead" | "Purchase"
      event_id, // نفس المعرّف المستخدم في المتصفح، لمنع التكرار
      value,
      currency = "DZD",
      phone,
      name,
      fbp,
      fbc,
      user_agent,
      event_source_url,
    } = body;

    // عنوان IP الحقيقي للزائر يأتي من رؤوس الطلب نفسها (أدق وأوثق
    // من محاولة قراءته من طرف المتصفح، وهو أمر غير ممكن أصلاً).
    // لأحداث Purchase (القادمة من قاعدة البيانات لاحقًا)، لا يوجد
    // اتصال حي وقتها، لذا يبقى هذا الحقل فارغًا وهذا متوقع وطبيعي.
    const client_ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      undefined;

    if (!event_name || !event_id) {
      return new Response(
        JSON.stringify({ error: "event_name و event_id مطلوبان" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    const user_data: Record<string, unknown> = {};

    if (phone) user_data.ph = [await sha256(normalizeAlgerianPhone(phone))];
    if (name) {
      // الاسم الأول فقط لتحسين نسبة المطابقة (Meta توصي بذلك)
      const firstName = name.trim().split(/\s+/)[0];
      user_data.fn = [await sha256(firstName)];
    }
    if (fbp) user_data.fbp = fbp;
    if (fbc) user_data.fbc = fbc;
    if (user_agent) user_data.client_user_agent = user_agent;
    if (client_ip) user_data.client_ip_address = client_ip;

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id, // نفس القيمة المُرسلة من dataLayer → يمنع التكرار مع بكسل المتصفح
          action_source: "website",
          event_source_url: event_source_url || "",
          user_data,
          custom_data: {
            currency,
            value: value ?? 0,
          },
        },
      ],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const metaResult = await metaRes.json();

    if (!metaRes.ok) {
      console.error("Meta CAPI error:", metaResult);
      return new Response(JSON.stringify({ error: metaResult }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, meta: metaResult }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("CAPI handler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
