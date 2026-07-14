import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Order, Product } from "../types";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, LogOut, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Product Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: 0, imageUrl: "", stock: 100
  });

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('createdAt', { ascending: false }),
        supabase.from('products').select('*').order('createdAt', { ascending: false })
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
    } catch (err: any) {
      console.error("Error fetching data:", JSON.stringify(err, null, 2));
      setError(err.message || "حدث خطأ أثناء جلب البيانات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const ordersSub = supabase.channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchData();
      })
      .subscribe();

    const productsSub = supabase.channel('products_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSub);
      supabase.removeChannel(productsSub);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('products').insert([{
        ...newProduct,
        createdAt: new Date().toISOString()
      }]);
      setShowAddProduct(false);
      setNewProduct({ name: "", description: "", price: 0, imageUrl: "", stock: 100 });
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        await supabase.from('products').delete().eq('id', productId);
        fetchData();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
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
          <h2 className="text-xl font-bold mb-2">خطأ في جلب البيانات</h2>
          <p className="text-sm mb-4" dir="ltr">{error}</p>
          <button onClick={() => window.location.reload()} className="text-emerald-600 hover:underline font-bold">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const statusLabels = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    shipped: "في الطريق",
    delivered: "تم التوصيل",
    cancelled: "ملغى"
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-l md:border-b-0 border-gray-200 p-4 md:min-h-screen shrink-0">
        <div className="font-bold text-xl text-gray-900 mb-8 px-4 py-2 hidden md:block">لوحة التحكم</div>
        <nav className="flex md:flex-col gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-right",
              activeTab === 'orders' ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <ShoppingCart className="w-5 h-5" />
            الطلبات
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-auto">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              "flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-right",
              activeTab === 'products' ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Package className="w-5 h-5" />
            المنتجات
          </button>
          
          <div className="hidden md:block mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-right"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                    <th className="p-4 font-medium">العميل</th>
                    <th className="p-4 font-medium">المنتج</th>
                    <th className="p-4 font-medium">الولاية</th>
                    <th className="p-4 font-medium">المبلغ</th>
                    <th className="p-4 font-medium">الحالة</th>
                    <th className="p-4 font-medium">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500" dir="ltr">{order.customerPhone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{order.productName}</div>
                        <div className="text-sm text-gray-500">الكمية: {order.quantity}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-900">{order.customerWilaya}</div>
                        <div className="text-sm text-gray-500 max-w-[150px] truncate" title={order.customerAddress}>
                          {order.customerAddress}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900 text-nowrap">
                        {order.totalAmount.toLocaleString('ar-DZ')} د.ج
                      </td>
                      <td className="p-4">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium", statusColors[order.status])}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="p-4">
                        <select 
                          className="bg-white border border-gray-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2 outline-none"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="confirmed">تأكيد</option>
                          <option value="shipped">شحن</option>
                          <option value="delivered">تم التوصيل</option>
                          <option value="cancelled">إلغاء</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">لا توجد طلبات حاليا</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
              <button 
                onClick={() => setShowAddProduct(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                إضافة منتج جديد
              </button>
            </div>

            {showAddProduct && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">منتج جديد</h2>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                    <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر (د.ج)</label>
                    <input type="number" required min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                    <textarea required rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة (URL)</label>
                    <input type="url" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المخزون المتوفر</label>
                    <input type="number" required min="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setShowAddProduct(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium shadow-md shadow-emerald-200">حفظ المنتج</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex flex-col">
                  <div className="aspect-video bg-gray-100 relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                    <div className="text-emerald-600 font-bold mb-3">{product.price.toLocaleString('ar-DZ')} د.ج</div>
                    <div className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</div>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-600">المخزون: {product.stock}</span>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="حذف المنتج"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && !showAddProduct && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
                  لا توجد منتجات حاليا
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
