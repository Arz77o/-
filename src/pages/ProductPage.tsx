import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Product } from "../types";
import { wilayas, getCommunesByWilayaId } from 'algeria-locations';
import { ArrowRight, Loader2, CheckCircle2, ShieldCheck, Truck, RotateCcw, Eye, Sparkles, AlertCircle, ThumbsUp } from "lucide-react";
import { cn } from "../lib/utils";
import { getShippingRates, ShippingRate } from "../lib/shipping";
import { trackViewContent, trackLead, getMetaCookies, generateEventId } from "../lib/tracking";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    wilayaId: "16", // Default to Algiers (id: 16)
    baladiya: "",
    shippingType: "home"
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [productRes, ratesRes] = await Promise.all([
          supabase.from('products').select('*').eq('id', id).single(),
          getShippingRates()
        ]);

        if (productRes.error) throw productRes.error;
        if (productRes.data) {
          const fetchedProduct = productRes.data as Product;
          setProduct(fetchedProduct);
          setActiveImage(fetchedProduct.imageUrl || "");
          trackViewContent({
            id: fetchedProduct.id,
            name: fetchedProduct.name,
            price: fetchedProduct.price,
          });
        }
        setShippingRates(ratesRes);
      } catch (err: any) {
        console.error("Error fetching data:", JSON.stringify(err, null, 2));
        setError(err.message || "حدث خطأ أثناء جلب المنتج.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const shippingCost = useMemo(() => {
    const rate = shippingRates.find(r => r.wilaya_id === formData.wilayaId);
    if (!rate) return formData.shippingType === 'home' ? 800 : 400; // default fallback
    return formData.shippingType === 'home' ? rate.home_price : rate.desk_price;
  }, [shippingRates, formData.wilayaId, formData.shippingType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || submitting) return;

    setSubmitting(true);
    try {
      const productTotal = product.price * quantity;
      const totalAmount = productTotal + Number(shippingCost);
      
      const selectedWilaya = wilayas.find(w => w.id.toString() === formData.wilayaId);
      const wilayaName = selectedWilaya ? selectedWilaya.name_ar : formData.wilayaId;

      const { fbp, fbc } = getMetaCookies();

      // نولّد المعرّفات محليًا قبل الإرسال، بدل قراءتها من قاعدة
      // البيانات بعد الإدراج — لأن سياسة RLS الحالية تسمح بالإدراج
      // للجميع لكن لا تسمح بالقراءة إلا للمستخدمين المسجّلين، وأي
      // محاولة .select() بعد insert() كانت ستفشل بصمت للزبون العادي.
      const orderId = crypto.randomUUID();
      const leadEventId = generateEventId();

      const { error } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          productId: product.id,
          productName: product.name,
          quantity,
          selectedSize: selectedSize || null,
          selectedColor: selectedColor || null,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: `طريقة التوصيل: ${formData.shippingType === 'home' ? 'للمنزل' : 'لمكتب الشحن'} | تكلفة الشحن: ${shippingCost} د.ج | البلدية: ${formData.baladiya} | تفاصيل العنوان: ${formData.address}`,
          customerWilaya: wilayaName,
          totalAmount,
          status: "pending",
          createdAt: new Date().toISOString(),
          lead_event_id: leadEventId,
          // نحفظ بيانات المطابقة الآن، لأنها ستُفقد نهائيًا بعد إغلاق
          // الزبون للمتصفح، ونحتاجها لاحقًا عند إرسال Purchase عند التسليم
          fbp,
          fbc,
          client_user_agent: navigator.userAgent,
        }]);

      if (error) throw error;

      // نُطلق Lead بعد نجاح الحفظ الفعلي فقط، بنفس المعرّف الذي حُفظ
      // مع الطلب — كتابة واحدة فقط، بلا حاجة لأي تحديث لاحق قد يُحجب.
      trackLead({
        eventId: leadEventId,
        value: totalAmount,
        phone: formData.phone,
        name: formData.name,
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2">خطأ في جلب المنتج</h2>
          <p className="text-sm mb-4" dir="ltr">{error}</p>
          <button onClick={() => navigate('/')} className="text-emerald-600 hover:underline font-bold">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl font-bold mb-4">المنتج غير موجود</h2>
        <button onClick={() => navigate('/')} className="text-emerald-600 hover:underline">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // حساب السعر السابق لإظهار التخفيض وجذب العملاء لشراء المنتج وزيادة نسبة التحويل
  const originalPrice = Math.round((product.price * 1.35) / 100) * 100;
  const discountAmount = originalPrice - product.price;

  return (
    <div className="pb-20 md:pb-12">
      <main className="max-w-5xl mx-auto px-4 mt-6">
        {/* Back Link */}
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors group font-medium"
        >
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          <span>العودة للتسوق</span>
        </button>

        {success ? (
          <div className="bg-white md:rounded-2xl p-8 md:p-12 text-center max-w-md mx-auto mt-8 border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تم تسجيل طلبك بنجاح!</h2>
            <p className="text-gray-500 mb-8">
              سنتصل بك قريباً على الرقم <span className="font-bold text-gray-900" dir="ltr">{formData.phone}</span> لتأكيد الطلب.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-colors"
            >
              العودة للتسوق
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-0 md:gap-8 lg:gap-12 items-start">
            
            {/* Product Details */}
            <div className="w-full md:w-1/2 bg-white md:rounded-3xl overflow-hidden border-b md:border border-gray-100 shadow-sm md:sticky md:top-24">
              <div className="aspect-square bg-gray-100 relative">
                {activeImage ? (
                  <img 
                    src={activeImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    لا توجد صورة
                  </div>
                )}
              </div>

              {/* Thumbnails gallery */}
              {product.imageUrl && [product.imageUrl, ...(product.images || [])].filter(Boolean).length > 1 && (
                <div className="flex gap-2 px-5 py-4 overflow-x-auto bg-gray-50/50 border-t border-b border-gray-100" dir="rtl">
                  {[product.imageUrl, ...(product.images || [])].filter(Boolean).map((img, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={cn(
                        "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white",
                        activeImage === img ? "border-emerald-600 scale-95 shadow-sm" : "border-gray-100 hover:border-gray-300"
                      )}
                    >
                      <img src={img} alt="Product Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              
              <div className="p-5 md:p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  {product.name}
                </h1>
                
                {/* Pricing */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-extrabold text-emerald-600">
                      {product.price.toLocaleString('ar-DZ')} <span className="text-lg font-bold">د.ج</span>
                    </span>
                    <span className="text-base text-gray-400 line-through font-medium">
                      {originalPrice.toLocaleString('ar-DZ')} د.ج
                    </span>
                  </div>
                </div>
                
                <div className="prose prose-sm text-gray-600 mb-8 max-w-none border-b border-gray-100 pb-6">
                  {product.description.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 text-gray-700 leading-relaxed">{line}</p>
                  ))}
                </div>

                {/* Highly Trustworthy Conversion Badges (Trust Badges) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ضمانات التسوق الآمن معنا:
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Badge 1 */}
                    <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 mb-0.5">افتح وافحص طردك بحريّة</h4>
                        <p className="text-[10px] text-gray-500 leading-normal">لديك الحق الكامل في فحص جودة المنتج ومعاينته قبل دفع أي مبلغ للموزع.</p>
                      </div>
                    </div>

                    {/* Badge 2 */}
                    <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 mb-0.5">الدفع عند الاستلام (COD)</h4>
                        <p className="text-[10px] text-gray-500 leading-normal">تسوق بأمان ومصداقية تامة، لا تدفع أي شيء حتى تستلم المنتج في بيتك.</p>
                      </div>
                    </div>

                    {/* Badge 3 */}
                    <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 mb-0.5">استبدال واسترجاع مرن</h4>
                        <p className="text-[10px] text-gray-500 leading-normal">ضمان استرجاع أو استبدال سهل خلال 3 أيام في حال وجود أي خلل أو عيب.</p>
                      </div>
                    </div>

                    {/* Badge 4 */}
                    <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 mb-0.5">توصيل سريع ومضمون</h4>
                        <p className="text-[10px] text-gray-500 leading-normal">نوفر خدمة التوصيل الاحترافي إلى باب منزلك في كافة ولايات الجزائر الـ 58.</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="w-full md:w-1/2 p-5 md:p-0">
              <div className="bg-white md:rounded-3xl p-6 md:p-8 border-2 border-emerald-500 shadow-xl relative overflow-hidden">
                {/* Hot Sale Badge */}
                <div className="absolute top-0 left-0 bg-rose-500 text-white text-[10px] font-bold px-4 py-1 rounded-br-2xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span>متوفر في المخزون</span>
                </div>

                <h2 className="text-xl font-extrabold text-gray-900 mb-2 mt-2 flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-emerald-600 rounded-full"></div>
                  أطلب الآن بسهولة
                </h2>
                <p className="text-xs text-gray-500 mb-5 font-medium">أدخل معلوماتك وسنتصل بك فوراً لتأكيد طلبك وتوصيله</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Size Selector */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700">
                          اختر المقاس <span className="text-rose-500">*</span>
                        </label>
                        {selectedSize && (
                          <span className="text-xs text-emerald-600 font-medium">المقاس المختار: {selectedSize}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2" dir="ltr">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              "px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all shadow-sm",
                              selectedSize === size
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selector */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700">
                          اختر اللون <span className="text-rose-500">*</span>
                        </label>
                        {selectedColor && (
                          <span className="text-xs text-emerald-600 font-medium">اللون المختار: {selectedColor}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                              "px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all shadow-sm",
                              selectedColor === color
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                            )}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity selector */}
                  <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-0.5">
                        حدد الكمية المطلوبة
                      </label>
                      <p className="text-[10px] text-gray-400">كلما زادت الكمية زادت جودة الخدمة</p>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <button 
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-colors text-gray-500"
                      >
                        -
                      </button>
                      <div className="w-12 h-10 flex items-center justify-center font-bold text-gray-900 border-x border-gray-200">
                        {quantity}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))}
                        className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-colors text-gray-500"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Contact Information Group */}
                  <div className="space-y-4 bg-emerald-50/10 p-4 rounded-2xl border border-emerald-100/30">
                    <h3 className="text-xs font-bold text-emerald-800 border-b border-emerald-100/30 pb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      1. معلومات الاتصال والزبون
                    </h3>
                    
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-gray-700 mb-1.5">
                        الاسم الكامل للزبون <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white outline-none transition-all text-sm shadow-sm placeholder:text-gray-400"
                        placeholder="مثال: محمد أحمد"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-1.5">
                        رقم الهاتف لتأكيد الطلب <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        dir="ltr"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white outline-none transition-all text-right text-sm shadow-sm placeholder:text-gray-400"
                        placeholder="05XX XX XX XX"
                      />
                    </div>
                  </div>

                  {/* Delivery Location Group */}
                  <div className="space-y-4 bg-blue-50/10 p-4 rounded-2xl border border-blue-100/20">
                    <h3 className="text-xs font-bold text-blue-800 border-b border-blue-100/20 pb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      2. مكان وطريقة التوصيل
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        اختر طريقة الاستلام المريحة لك
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${formData.shippingType === 'home' ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold' : 'border-gray-200 bg-white hover:border-emerald-200 text-gray-600'}`}>
                          <input type="radio" name="shippingType" value="home" checked={formData.shippingType === 'home'} onChange={(e) => setFormData({...formData, shippingType: e.target.value})} className="hidden" />
                          <span className="text-xs">توصيل للبيت</span>
                        </label>
                        <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${formData.shippingType === 'desk' ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold' : 'border-gray-200 bg-white hover:border-emerald-200 text-gray-600'}`}>
                          <input type="radio" name="shippingType" value="desk" checked={formData.shippingType === 'desk'} onChange={(e) => setFormData({...formData, shippingType: e.target.value})} className="hidden" />
                          <span className="text-xs">استلام من مكتب الشحن</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="wilaya" className="block text-xs font-bold text-gray-700 mb-1.5">
                          الولاية <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id="wilaya"
                          required
                          value={formData.wilayaId}
                          onChange={e => setFormData({ ...formData, wilayaId: e.target.value, baladiya: "" })}
                          className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white outline-none transition-all text-xs font-medium shadow-sm"
                        >
                          {wilayas.map((w) => (
                            <option key={w.id} value={w.id.toString()}>{w.code} - {w.name_ar}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="baladiya" className="block text-xs font-bold text-gray-700 mb-1.5">
                          البلدية <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id="baladiya"
                          required
                          value={formData.baladiya}
                          onChange={e => setFormData({ ...formData, baladiya: e.target.value })}
                          className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white outline-none transition-all text-xs font-medium shadow-sm"
                        >
                          <option value="">اختر البلدية</option>
                          {getCommunesByWilayaId(parseInt(formData.wilayaId, 10)).map((c) => (
                            <option key={c.id} value={c.name_ar}>{c.name_ar}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-xs font-bold text-gray-700 mb-1.5">
                        العنوان بالتفصيل أو اسم الحي <span className="text-gray-400 font-normal">(اختياري ومستحسن)</span>
                      </label>
                      <textarea
                        id="address"
                        rows={1}
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white outline-none transition-all resize-none text-xs shadow-sm placeholder:text-gray-300"
                        placeholder="مثال: حي السلام عمارة رقم 4"
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>سعر المنتج ({quantity}x):</span>
                        <span>{(product.price * quantity).toLocaleString('ar-DZ')} د.ج</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span>تكلفة الشحن ({formData.shippingType === 'home' ? 'للمنزل' : 'للمكتب'}):</span>
                        <span>{shippingCost.toLocaleString('ar-DZ')} د.ج</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                        <span className="text-gray-900 font-bold">المجموع الإجمالي:</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {((product.price * quantity) + Number(shippingCost)).toLocaleString('ar-DZ')} د.ج
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={cn(
                        "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2",
                        submitting && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "تأكيد الطلب الآن"
                      )}
                    </button>
                    <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      الدفع يكون عند استلام المنتج
                    </p>
                  </div>
                </form>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
