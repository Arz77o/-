# دليل إعداد التتبع: GTM + Meta Pixel + CAPI

هذا الدليل يشرح كل خطوة يدوية متبقية بعد التعديلات البرمجية. اتبع الترتيب بالضبط.

---

## 1. إنشاء حاوية GTM (إن لم تكن موجودة)

1. اذهب إلى [tagmanager.google.com](https://tagmanager.google.com) → أنشئ حاوية جديدة نوع **Web**
2. انسخ **معرّف الحاوية** (يبدأ بـ `GTM-`)
3. في ملف `index.html`، استبدل **كل** ظهور لـ `GTM-XXXXXXX` (يوجد مكانان) بمعرّفك الفعلي

---

## 2. إعداد Meta Pixel داخل GTM

### أ. المتغيرات (Variables)
اذهب لـ **Variables → New** وأنشئ متغيرات من نوع **Data Layer Variable** لكل من:
| اسم المتغير | Data Layer Variable Name |
|---|---|
| DLV - event_id | `event_id` |
| DLV - value | `value` |
| DLV - currency | `currency` |

### ب. الـ Triggers (المشغّلات)
أنشئ 3 Triggers من نوع **Custom Event**:
| اسم الـ Trigger | Event name |
|---|---|
| Trigger - Page View | `page_view` |
| Trigger - View Content | `view_item` |
| Trigger - Lead | `generate_lead` |

### ج. الـ Tags
ابحث في **Tag Templates Gallery** عن **"Facebook Pixel"** (من Stape أو الرسمي)، وأنشئ 3 Tags:

1. **Meta - PageView**
   - Pixel ID: `1698562094890502`
   - Event Type: Standard → `PageView`
   - Event ID: اربطه بمتغير `DLV - event_id` (أو اتركه فارغًا، PageView لا يحتاج CAPI مطابق حاليًا)
   - Trigger: `Trigger - Page View`

2. **Meta - ViewContent**
   - نفس Pixel ID
   - Event Type: `ViewContent`
   - Value: `{{DLV - value}}`, Currency: `{{DLV - currency}}`
   - Trigger: `Trigger - View Content`

3. **Meta - Lead**
   - نفس Pixel ID
   - Event Type: `Lead`
   - Event ID: **إلزامي** → `{{DLV - event_id}}` (هذا هو ما يمنع التكرار مع CAPI)
   - Value: `{{DLV - value}}`, Currency: `{{DLV - currency}}`
   - Trigger: `Trigger - Lead`
   - ✅ فعّل **Advanced Matching** في إعدادات الـ Tag

**انشر الحاوية (Submit → Publish) بعد إضافة كل الـ Tags.**

---

## 3. نشر Edge Function على Supabase

```bash
supabase functions deploy meta-capi
```

ثم أضف الأسرار (Secrets) من Supabase Dashboard → **Edge Functions → meta-capi → Secrets**:

| المتغير | القيمة |
|---|---|
| `META_PIXEL_ID` | `1698562094890502` |
| `META_ACCESS_TOKEN` | من Events Manager → Settings → Conversions API → Generate Access Token |
| `PURCHASE_TRIGGER_SECRET` | نص عشوائي طويل من اختيارك (يحمي حدث Purchase تحديدًا من الحقن الخارجي) |
| `META_TEST_EVENT_CODE` | (اختياري، احذفه بعد انتهاء الاختبار) |

**لماذا لا يوجد رمز سري لحدث Lead؟** Supabase تتحقق تلقائيًا (بشكل مدمج) أن كل استدعاء يحمل مفتاح anon key صالحًا قبل وصوله لكودنا أصلاً. حدث Lead من زبون حقيقي يتصفح الموقع أمر متوقع، فلا حاجة لحماية إضافية. أما Purchase فمحمي بالرمز السري أعلاه، لأنه يجب ألا يأتي إلا من قاعدة البيانات نفسها.

---

## 4. تشغيل ملف SQL

في Supabase Dashboard → **SQL Editor**، شغّل الملف `supabase/migration_meta_tracking.sql` كاملاً.

بعده، شغّل هذه الأسطر الثلاثة (بعد استبدال القيم):
```sql
ALTER DATABASE postgres SET app.settings.capi_function_url =
  'https://<project-ref>.supabase.co/functions/v1/meta-capi';
ALTER DATABASE postgres SET app.settings.service_role_key =
  '<من Project Settings → API → service_role key>';
ALTER DATABASE postgres SET app.settings.purchase_trigger_secret =
  '<نفس PURCHASE_TRIGGER_SECRET المُعرَّف في الخطوة السابقة>';
```

⚠️ **`service_role_key` له صلاحيات كاملة على قاعدة بياناتك.** تخزينه كإعداد على مستوى قاعدة البيانات (كما هنا) آمن ولا يظهر لأي عميل خارجي، لكن لا تضعه أبدًا في أي ملف يصل للمتصفح (مثل `.env` الخاص بالموقع نفسه).

---

## 5. الاختبار قبل التفعيل الكامل

1. أضف `META_TEST_EVENT_CODE` مؤقتًا من تبويب **Test Events** في Events Manager
2. افتح موقعك، أنشئ طلبًا تجريبيًا كاملاً
3. تحقق في **Test Events** من ظهور:
   - `PageView` و`ViewContent` بمصدر **Browser**
   - `Lead` بمصدرين معًا: **Browser** و**Server** — بنفس Event ID، ومُدمجين تلقائيًا (Deduplicated) في نفس السطر
4. من لوحة تحكم المتجر، غيّر حالة نفس الطلب التجريبي إلى **"تم التوصيل"**
5. تحقق أن `Purchase` وصل من **Server فقط** (كما هو مقصود، فلا بكسل متصفح وقت التسليم)
6. بعد التأكد أن كل شيء يعمل، **احذف `META_TEST_EVENT_CODE`** من الأسرار لتفعيل الإرسال الحقيقي

---

## ملخص المعمارية النهائية

```
الموقع (React)
  → dataLayer فقط (لا يوجد fbq() في أي مكان بالكود)
      → GTM يُطلق Meta Pixel في المتصفح (PageView, ViewContent, Lead)
  → عند نجاح الطلب: نداء مباشر لـ Edge Function → CAPI Lead (نفس event_id)
  → عند تغيير الحالة لـ "تم التوصيل": Trigger قاعدة البيانات تلقائيًا
      → Edge Function → CAPI Purchase (بيانات fbp/fbc المحفوظة وقت الطلب)
```

**كل حدث Lead له مصدران بنفس event_id (دمج تلقائي، بلا تكرار).
كل حدث Purchase مصدره السيرفر فقط، ويُطلق تلقائيًا من قاعدة البيانات — لا يعتمد على أي فعل يدوي في المتصفح.**
