import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Product } from "../types";
import { wilayas, getCommunesByWilayaId } from 'algeria-locations';
import { ArrowRight, Loader2, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { cn } from "../lib/utils";
import { getShippingRates, ShippingRate } from "../lib/shipping";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [quantity, setQuantity] = useState(1);
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
          setProduct(productRes.data as Product);
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

      const { error } = await supabase.from('orders').insert([{
        productId: product.id,
        productName: product.name,
        quantity,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: `طريقة التوصيل: ${formData.shippingType === 'home' ? 'للمنزل' : 'لمكتب الشحن'} | تكلفة الشحن: ${shippingCost} د.ج | البلدية: ${formData.baladiya} | تفاصيل العنوان: ${formData.address}`,
        customerWilaya: wilayaName,
        totalAmount,
        status: "pending",
        createdAt: new Date().toISOString()
      }]);

      if (error) throw error;

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-medium text-gray-900 truncate">{product.name}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto md:px-4 mt-0 md:mt-8">
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
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    لا توجد صورة
                  </div>
                )}
              </div>
              
              <div className="p-5 md:p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  {product.name}
                </h1>
                <div className="text-3xl font-bold text-emerald-600 mb-6">
                  {product.price.toLocaleString('ar-DZ')} <span className="text-lg">د.ج</span>
                </div>
                
                <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
                  {product.description.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                    <Truck className="w-5 h-5 text-gray-400" />
                    <span>توصيل سريع لكل الولايات (الدفع عند الاستلام)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                    <span>ضمان الجودة واسترجاع الأموال</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="w-full md:w-1/2 p-5 md:p-0">
              <div className="bg-white md:rounded-3xl p-6 md:p-8 border-2 border-emerald-100 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
                  أطلب الآن (الدفع عند الاستلام)
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الكمية
                    </label>
                    <div className="flex items-center border border-gray-200 rounded-xl w-fit overflow-hidden bg-gray-50">
                      <button 
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-12 h-12 flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <div className="w-16 h-12 flex items-center justify-center font-bold bg-white border-x border-gray-200">
                        {quantity}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))}
                        className="w-12 h-12 flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-gray-700 mb-1">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all"
                      placeholder="أدخل اسمك ولقبك"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      dir="ltr"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all text-right"
                      placeholder="05XX XX XX XX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      طريقة التوصيل
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.shippingType === 'home' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-emerald-200'}`}>
                        <input type="radio" name="shippingType" value="home" checked={formData.shippingType === 'home'} onChange={(e) => setFormData({...formData, shippingType: e.target.value})} className="hidden" />
                        <span className="font-medium text-sm">توصيل للمنزل</span>
                      </label>
                      <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.shippingType === 'desk' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-emerald-200'}`}>
                        <input type="radio" name="shippingType" value="desk" checked={formData.shippingType === 'desk'} onChange={(e) => setFormData({...formData, shippingType: e.target.value})} className="hidden" />
                        <span className="font-medium text-sm">توصيل لمكتب الشحن</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="wilaya" className="block text-xs font-bold text-gray-700 mb-1">
                      الولاية
                    </label>
                    <select
                      id="wilaya"
                      required
                      value={formData.wilayaId}
                      onChange={e => setFormData({ ...formData, wilayaId: e.target.value, baladiya: "" })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all"
                    >
                      {wilayas.map((w) => (
                        <option key={w.id} value={w.id.toString()}>{w.code} - {w.name_ar}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="baladiya" className="block text-xs font-bold text-gray-700 mb-1">
                      البلدية
                    </label>
                    <select
                      id="baladiya"
                      required
                      value={formData.baladiya}
                      onChange={e => setFormData({ ...formData, baladiya: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all"
                    >
                      <option value="">اختر البلدية</option>
                      {getCommunesByWilayaId(parseInt(formData.wilayaId, 10)).map((c) => (
                        <option key={c.id} value={c.name_ar}>{c.name_ar}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-xs font-bold text-gray-700 mb-1">
                      تفاصيل العنوان (الحي، الشارع)
                    </label>
                    <textarea
                      id="address"
                      required
                      rows={2}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all resize-none"
                      placeholder="أدخل عنوان التوصيل بالتفصيل"
                    ></textarea>
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
