import { ArrowRight, RefreshCw, ShieldCheck, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12" dir="rtl">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm hover:bg-gray-100 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">سياسة الإسترجاع و الإستبدال</h1>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">نهتم برضاكم دائماً</p>
              <h2 className="text-xl font-bold text-gray-900">شروط إرجاع واستبدال المنتجات</h2>
            </div>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                الفترة الزمنية للإرجاع والاستبدال
              </h3>
              <p className="text-gray-600 pr-4">
                تتيح سياسة متجرنا إمكانية إرجاع المنتجات أو استبدالها خلال فترة أقصاها <span className="font-semibold text-gray-900">3 أيام</span> من تاريخ استلام الطلب، شريطة أن يكون المنتج في حالته الأصلية.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                الحالة الأصلية للمنتج
              </h3>
              <p className="text-gray-600 pr-4">
                يجب أن تكون المنتجات المراد إرجاعها أو استبدالها غير مستخدمة، وفي تغليفها الأصلي السليم، مع الاحتفاظ بكافة الملحقات والبطاقات التعريفية (إن وجدت). لا يمكن إرجاع أي منتج تالف أو منقوص العبوة.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                حالات المنتجات التالفة أو الخاطئة
              </h3>
              <p className="text-gray-600 pr-4">
                إذا كان المنتج المستلم تالفاً أو مختلفاً عن الذي تم طلبه، فإننا نتحمل كافة تكاليف الشحن والتوصيل الإضافية لاستبداله أو إرجاعه، دون أي رسوم إضافية على العميل. يرجى مراجعة تفاصيل الطلب وتصوير المنتج والتواصل معنا فوراً.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                تكاليف ورسوم الشحن
              </h3>
              <p className="text-gray-600 pr-4">
                في حال كان الإرجاع أو الاستبدال بناءً على رغبة العميل (دون وجود عيب أو خطأ في المنتج)، يتحمل العميل رسوم توصيل الشحن الإضافية للإرجاع أو الاستبدال.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                طريقة تقديم طلب الإرجاع أو الاستبدال
              </h3>
              <p className="text-gray-600 pr-4">
                يسعدنا دائماً خدمتكم، لتقديم طلب الإرجاع أو الاستبدال، يرجى التواصل معنا عبر الواتساب أو الاتصال المباشر عبر الأرقام الموضحة في المتجر، وسيقوم فريق خدمة العملاء بالتنسيق معكم وترتيب استلام المنتج في أقرب وقت.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 -mx-6 -mb-6 md:-mx-10 md:-mb-10 p-6 md:p-8 rounded-b-3xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="font-bold text-gray-900 text-sm">تسوق آمن وموثوق %100</p>
                <p className="text-xs text-gray-500">نحن هنا لضمان تجربة تسوق ممتازة وفريدة</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              العودة للمتجر والطلب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
