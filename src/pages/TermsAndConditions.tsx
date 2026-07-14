import { ArrowRight, FileText, Scale, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsAndConditions() {
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
          <h1 className="text-2xl font-bold text-gray-900">الشروط والأحكام</h1>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">اتفاقية استخدام الموقع</p>
              <h2 className="text-xl font-bold text-gray-900">الشروط والأحكام العامة للمتجر</h2>
            </div>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            {/* Intro */}
            <p className="text-gray-600">
              مرحباً بكم في متجرنا الإلكتروني. بدخولكم واستخدامكم للموقع أو تقديم طلب شراء، فإنكم توافقون على الالتزام بالشروط والأحكام التالية. يرجى قراءتها بعناية قبل المتابعة.
            </p>

            {/* Section 1 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                شروط الشراء وتأكيد الطلب
              </h3>
              <p className="text-gray-600 pr-4">
                عند تقديم طلب من خلال المتجر، فإنك توافق على تزويدنا بمعلومات صحيحة ودقيقة، بما في ذلك الاسم الكامل ورقم الهاتف وعنوان التوصيل بدقة. سيقوم فريق خدمة العملاء بالاتصال بك هاتفياً لتأكيد الطلب وعنوان التوصيل قبل إرسال الشحنة.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                الدفع عند الاستلام (COD)
              </h3>
              <p className="text-gray-600 pr-4">
                نعتمد طريقة الدفع عند الاستلام كوسيلة دفع رئيسية وآمنة لعملائنا في الجزائر. يقوم العميل بدفع قيمة المنتج وتكلفة الشحن نقداً لسائق التوصيل فور استلام المنتج ومعاينته.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                خدمة الشحن والتوصيل
              </h3>
              <p className="text-gray-600 pr-4">
                نوفر خدمة التوصيل السريع إلى مختلف الولايات. تختلف تكلفة الشحن ومدة التوصيل بحسب الولاية المحددة في الطلب. نحن نبذل قصارى جهدنا لتسليم الطلبات في أسرع وقت ممكن، ولكن قد تحدث بعض التأخيرات الاستثنائية الخارجة عن إرادتنا.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                حقوق الملكية الفكرية
              </h3>
              <p className="text-gray-600 pr-4">
                جميع المحتويات المتوفرة على هذا الموقع، بما في ذلك التصاميم، الصور، النصوص، الشعارات، والبرمجيات، هي ملك للمتجر ومحمية بموجب قوانين حماية الملكية الفكرية. لا يُسمح بنسخ أو استخدام أي جزء منها للأغراض التجارية دون موافقتنا المكتوبة مسبقاً.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="text-lg font-bold text-gray-950 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                سرية وأمان البيانات
              </h3>
              <p className="text-gray-600 pr-4">
                نحن ملتزمون بحماية خصوصيتك وسرية بياناتك الشخصية. لن نقوم بمشاركة أو بيع معلومات الاتصال الخاصة بك مع أي طرف ثالث، ويقتصر استخدامها على تأكيد وتوصيل طلباتك وتحسين خدماتنا المقدمة لك.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 -mx-6 -mb-6 md:-mx-10 md:-mb-10 p-6 md:p-8 rounded-b-3xl">
            <div className="flex items-center gap-3">
              <Eye className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="font-bold text-gray-900 text-sm">التزام بالشفافية والوضوح</p>
                <p className="text-xs text-gray-500">تحديث مستمر للشروط لضمان حقوق الجميع</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              موافق والعودة للمتجر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
