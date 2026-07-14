import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product } from "../types";
import { wilayas } from "../lib/data";
import { ArrowRight, Loader2, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { cn } from "../lib/utils";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    wilaya: wilayas[15] // Default to Algiers (index 15)
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || submitting) return;

    setSubmitting(true);
    try {
      const totalAmount = product.price * quantity;
      
      await addDoc(collection(db, "orders"), {
        productId: product.id,
        productName: product.name,
        quantity,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        customerWilaya: formData.wilaya,
        totalAmount,
        status: "pending",
        createdAt: serverTimestamp()
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
                    <label htmlFor="wilaya" className="block text-xs font-bold text-gray-700 mb-1">
                      الولاية
                    </label>
                    <select
                      id="wilaya"
                      required
                      value={formData.wilaya}
                      onChange={e => setFormData({ ...formData, wilaya: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all"
                    >
                      {wilayas.map((w, i) => (
                        <option key={i} value={w}>{i + 1} - {w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-xs font-bold text-gray-700 mb-1">
                      العنوان الكامل (البلدية، الحي)
                    </label>
                    <textarea
                      id="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all resize-none"
                      placeholder="أدخل عنوان التوصيل بالتفصيل"
                    ></textarea>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-gray-600 font-medium">المجموع الإجمالي:</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {(product.price * quantity).toLocaleString('ar-DZ')} د.ج
                      </span>
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
