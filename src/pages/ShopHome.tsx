import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Product } from "../types";
import { Link } from "react-router-dom";
import { Loader2, ShoppingBag } from "lucide-react";

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (fetchError) throw fetchError;
        if (data) setProducts(data as Product[]);
      } catch (err: any) {
        console.error("Error fetching products:", JSON.stringify(err, null, 2));
        setError(err.message || "حدث خطأ أثناء جلب المنتجات. يرجى التحقق من إعدادات Supabase الخاصة بك.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            <span>متجري</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">أحدث المنتجات</h1>
        
        {error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">
            <p className="font-bold mb-2">خطأ في الاتصال بقاعدة البيانات</p>
            <p className="text-sm" dir="ltr">{error}</p>
            <p className="text-sm mt-4">يرجى التأكد من إضافة مفاتيح Supabase الخاصة بك في إعدادات التطبيق (Environment Variables).</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            لا توجد منتجات حاليا.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <Link 
                key={product.id} 
                to={`/product/${product.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
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
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <div className="mt-auto font-bold text-emerald-600 text-lg">
                    {product.price.toLocaleString('ar-DZ')} د.ج
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
