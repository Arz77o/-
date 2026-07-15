// ============================================================
// Telegram Notification for New Orders
// ============================================================
// تُرسل إشعارًا إلى بوت تيليغرام عند إنشاء طلب جديد في الموقع.
//
// المتغيرات البيئية المطلوبة:
//   TELEGRAM_BOT_TOKEN   - توكن البوت من @BotFather
//   TELEGRAM_CHAT_ID     - معرف الشات (رقمي، أو @username للمجموعة)
//
// كيف تعمل:
//   1. Trigger في قاعدة البيانات (بعد إدراج طلب جديد) يستدعيها
//   2. أو يمكن استدعاؤها مباشرة من كود الموقع بعد نجاح الطلب
// ============================================================

// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(text: string | number): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // التحقق من وجود المتغيرات البيئية
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return new Response(
      JSON.stringify({ error: "Telegram configuration not set" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const {
    orderId,
    customerName,
    customerPhone,
    customerWilaya,
    productName,
    quantity,
    totalAmount,
    selectedSize,
    selectedColor,
    address,
    createdAt,
  } = body;

  if (!orderId || !customerName || !customerPhone || !productName) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: orderId, customerName, customerPhone, productName" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // تاريخ الطلب
    const orderDate = createdAt
      ? new Date(createdAt).toLocaleString("ar-DZ", { timeZone: "Africa/Algiers" })
      : new Date().toLocaleString("ar-DZ", { timeZone: "Africa/Algiers" });

    // بناء رسالة تيليغرام
    const message = [
      "🆕 <b>طلب جديد</b>\n",
      `👤 <b>الاسم:</b> ${escapeHtml(customerName)}`,
      `📞 <b>الهاتف:</b> ${escapeHtml(customerPhone)}`,
      `📍 <b>الولاية:</b> ${escapeHtml(customerWilaya || "غير محدد")}`,
      `📦 <b>المنتج:</b> ${escapeHtml(productName)}`,
      `🔢 <b>الكمية:</b> ${escapeHtml(quantity || 1)}`,
      selectedSize ? `📏 <b>المقاس:</b> ${escapeHtml(selectedSize)}` : "",
      selectedColor ? `🎨 <b>اللون:</b> ${escapeHtml(selectedColor)}` : "",
      `💰 <b>المبلغ:</b> ${Number(totalAmount || 0).toLocaleString("ar-DZ")} د.ج`,
      address ? `🏠 <b>العنوان:</b> ${escapeHtml(address)}` : "",
      `\n🕐 <b>التاريخ:</b> ${escapeHtml(orderDate)}`,
      `🆔 <b>رقم الطلب:</b> <code>${escapeHtml(orderId)}</code>`,
    ]
      .filter(Boolean)
      .join("\n");

    // إرسال إلى تيليغرام
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    const telegramResult = await telegramRes.json();

    if (!telegramRes.ok) {
      console.error("Telegram API error:", telegramResult);
      return new Response(
        JSON.stringify({ error: telegramResult }),
        {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, telegram: telegramResult }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Telegram notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});