import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Order, Product } from "../types";
import { FiPackage, FiShoppingCart, FiLogOut, FiPlus, FiTrash2, FiEdit2, FiLoader } from "react-icons/fi";
import { HiOutlineTruck } from "react-icons/hi";
import { cn } from "../lib/utils";
import { getShippingRates, updateShippingRate } from "../lib/shipping";
import type { ShippingRate } from "../lib/shipping";
import { wilayas } from "algeria-locations";
import { getWilayaSupportType, isWilayaSupported } from "../lib/shippingConfig";

interface AdminDashboardProps {
  onLogout?: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'shipping'>('orders');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Product Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: 0, imageUrl: "", images: [] as string[], stock: 100, sizes: [] as string[], colors: [] as string[]
  });
  const [sizesInput, setSizesInput] = useState("");
  const [colorsInput, setColorsInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [additionalUrlInput, setAdditionalUrlInput] = useState("");

  // Edit Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editUploadingAdditional, setEditUploadingAdditional] = useState(false);
  const [editAdditionalUrlInput, setEditAdditionalUrlInput] = useState("");
  const [editSizesInput, setEditSizesInput] = useState("");
  const [editColorsInput, setEditColorsInput] = useState("");

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, ratesRes] = await Promise.all([
        supabase.from('orders').select('*').order('createdAt', { ascending: false }),
        supabase.from('products').select('*').order('createdAt', { ascending: false }),
        getShippingRates()
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
      setShippingRates(ratesRes);
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
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = "/admin/login";
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.")) {
      try {
        await supabase.from('orders').delete().eq('id', orderId);
        fetchData();
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setNewProduct({...newProduct, imageUrl: publicUrlData.publicUrl});
    } catch (error: any) {
      alert("خطأ في رفع الصورة: " + error.message + "\nتأكد من إنشاء Storage Bucket باسم 'product-images' في إعدادات Supabase.");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAdditional(true);
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      const files: File[] = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      setNewProduct(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));
    } catch (error: any) {
      alert("خطأ في رفع الصور الإضافية: " + error.message + "\nتأكد من إنشاء Storage Bucket باسم 'product-images' في إعدادات Supabase.");
      console.error(error);
    } finally {
      setUploadingAdditional(false);
    }
  };

  const addAdditionalUrl = () => {
    if (!additionalUrlInput.trim()) return;
    setNewProduct(prev => ({
      ...prev,
      images: [...(prev.images || []), additionalUrlInput.trim()]
    }));
    setAdditionalUrlInput("");
  };

  const removeAdditionalImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('products').insert([{
        ...newProduct,
        createdAt: new Date().toISOString()
      }]);
      setShowAddProduct(false);
      setNewProduct({ name: "", description: "", price: 0, imageUrl: "", images: [] as string[], stock: 100, sizes: [] as string[], colors: [] as string[] });
      setSizesInput("");
      setColorsInput("");
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          price: editingProduct.price,
          description: editingProduct.description,
          imageUrl: editingProduct.imageUrl,
          images: editingProduct.images,
          stock: editingProduct.stock,
          sizes: editingProduct.sizes,
          colors: editingProduct.colors,
        })
        .eq('id', editingProduct.id);
      
      if (error) throw error;
      setEditingProduct(null);
      fetchData();
    } catch (error: any) {
      console.error("Error editing product:", error);
      alert("حدث خطأ أثناء تعديل المنتج: " + error.message);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setEditUploadingImage(true);
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (editingProduct) {
        setEditingProduct({ ...editingProduct, imageUrl: publicUrlData.publicUrl });
      }
    } catch (error: any) {
      alert("خطأ في رفع الصورة: " + error.message + "\nتأكد من إنشاء Storage Bucket باسم 'product-images' في إعدادات Supabase.");
      console.error(error);
    } finally {
      setEditUploadingImage(false);
    }
  };

  const handleEditAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setEditUploadingAdditional(true);
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      const files: File[] = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      if (editingProduct) {
        setEditingProduct(prev => prev ? ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls]
        }) : null);
      }
    } catch (error: any) {
      alert("خطأ في رفع الصور الإضافية: " + error.message + "\nتأكد من إنشاء Storage Bucket باسم 'product-images' في إعدادات Supabase.");
      console.error(error);
    } finally {
      setEditUploadingAdditional(false);
    }
  };

  const addEditAdditionalUrl = () => {
    if (!editAdditionalUrlInput.trim() || !editingProduct) return;
    setEditingProduct(prev => prev ? ({
      ...prev,
      images: [...(prev.images || []), editAdditionalUrlInput.trim()]
    }) : null);
    setEditAdditionalUrlInput("");
  };

  const removeEditAdditionalImage = (index: number) => {
    if (!editingProduct) return;
    setEditingProduct(prev => prev ? ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }) : null);
  };

  const handleShippingUpdate = async (wilayaId: string, type: 'home' | 'desk', value: number) => {
    try {
      const rate = shippingRates.find(r => r.wilaya_id === wilayaId);
      const home_price = type === 'home' ? value : (rate?.home_price || 800);
      const desk_price = type === 'desk' ? value : (rate?.desk_price || 400);

      await updateShippingRate(wilayaId, home_price, desk_price);
      
      setShippingRates(prev => prev.map(r => 
        r.wilaya_id === wilayaId ? { ...r, home_price, desk_price } : r
      ));
    } catch (err: any) {
      alert("خطأ في تحديث السعر: " + err.message + "\nتأكد من تحديث قاعدة البيانات كما هو موضح.");
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
        <FiLoader className="w-8 h-8 animate-spin text-gray-400" />
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
            <FiShoppingCart className="w-5 h-5" />
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
            <FiPackage className="w-5 h-5" />
            المنتجات
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={cn(
              "flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-right",
              activeTab === 'shipping' ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <HiOutlineTruck className="w-5 h-5" />
            الشحن
          </button>
          
          <div className="hidden md:block mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-right"
            >
              <FiLogOut className="w-5 h-5" />
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
                    <th className="p-4 font-medium">المقاس / اللون</th>
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
                        <div className="text-sm text-gray-700">
                          {order.selectedSize && <span>المقاس: {order.selectedSize}</span>}
                          {order.selectedSize && order.selectedColor && <span> | </span>}
                          {order.selectedColor && <span>اللون: {order.selectedColor}</span>}
                          {!order.selectedSize && !order.selectedColor && <span className="text-gray-400">—</span>}
                        </div>
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
                        <div className="flex items-center gap-2">
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
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="حذف الطلب"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">لا توجد طلبات حاليا</td>
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
                <FiPlus className="w-5 h-5" />
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">صورة المنتج الرئيسية</label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 relative">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                        {uploadingImage && <FiLoader className="w-5 h-5 animate-spin text-emerald-600 absolute left-4 top-1/2 -translate-y-1/2" />}
                      </div>
                      <div className="text-gray-400 text-sm">أو</div>
                      <input type="url" placeholder="رابط صورة خارجي (URL)" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all" dir="ltr" />
                    </div>
                  </div>

                  <div className="md:col-span-2 border-t border-dashed border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">صور إضافية للمنتج (معرض الصور)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="relative">
                          <input type="file" accept="image/*" multiple onChange={handleAdditionalImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                          {uploadingAdditional && <FiLoader className="w-5 h-5 animate-spin text-emerald-600 absolute left-4 top-1/2 -translate-y-1/2" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">يمكنك اختيار عدة صور دفعة واحدة.</p>
                      </div>
                      <div className="flex gap-2">
                        <input type="url" placeholder="أو أضف رابط صورة خارجي" value={additionalUrlInput} onChange={e => setAdditionalUrlInput(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all" dir="ltr" />
                        <button type="button" onClick={addAdditionalUrl} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium">إضافة</button>
                      </div>
                    </div>

                    {newProduct.images && newProduct.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {newProduct.images.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group">
                            <img src={img} alt="Additional preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeAdditionalImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-bold bg-red-600 px-2 py-1 rounded">حذف</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المقاسات المتاحة</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="مثال: S, M, L, XL"
                        value={sizesInput}
                        onChange={e => setSizesInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parts = sizesInput.split(',').map(s => s.trim()).filter(Boolean);
                          setNewProduct(prev => ({ ...prev, sizes: [...new Set([...prev.sizes, ...parts])] }));
                          setSizesInput("");
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium"
                      >
                        إضافة
                      </button>
                    </div>
                    {newProduct.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newProduct.sizes.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                            {s}
                            <button type="button" onClick={() => setNewProduct(prev => ({ ...prev, sizes: prev.sizes.filter((_, j) => j !== i) }))} className="text-emerald-400 hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الألوان المتاحة</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="مثال: أحمر, أزرق, أسود"
                        value={colorsInput}
                        onChange={e => setColorsInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parts = colorsInput.split(',').map(s => s.trim()).filter(Boolean);
                          setNewProduct(prev => ({ ...prev, colors: [...new Set([...prev.colors, ...parts])] }));
                          setColorsInput("");
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium"
                      >
                        إضافة
                      </button>
                    </div>
                    {newProduct.colors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newProduct.colors.map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {c}
                            <button type="button" onClick={() => setNewProduct(prev => ({ ...prev, colors: prev.colors.filter((_, j) => j !== i) }))} className="text-blue-400 hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المخزون المتوفر</label>
                    <input type="number" required min="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setShowAddProduct(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                    <button type="submit" disabled={uploadingImage || uploadingAdditional} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium shadow-md shadow-emerald-200 transition-colors">حفظ المنتج</button>
                  </div>
                </form>
              </div>
            )}

            {editingProduct && (
              <div id="edit-product-section" className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiEdit2 className="w-5 h-5 text-blue-600" />
                  تعديل المنتج: {editingProduct.name}
                </h2>
                <form onSubmit={handleEditProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                    <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر (د.ج)</label>
                    <input type="number" required min="0" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                    <textarea required rows={3} value={editingProduct.description || ""} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">صورة المنتج الرئيسية</label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 relative">
                        <input type="file" accept="image/*" onChange={handleEditImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {editUploadingImage && <FiLoader className="w-5 h-5 animate-spin text-blue-600 absolute left-4 top-1/2 -translate-y-1/2" />}
                      </div>
                      <div className="text-gray-400 text-sm">أو</div>
                      <input type="url" placeholder="رابط صورة خارجي (URL)" value={editingProduct.imageUrl || ""} onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" dir="ltr" />
                    </div>
                  </div>

                  <div className="md:col-span-2 border-t border-dashed border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">صور إضافية للمنتج (معرض الصور)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="relative">
                          <input type="file" accept="image/*" multiple onChange={handleEditAdditionalImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                          {editUploadingAdditional && <FiLoader className="w-5 h-5 animate-spin text-blue-600 absolute left-4 top-1/2 -translate-y-1/2" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">يمكنك اختيار عدة صور دفعة واحدة.</p>
                      </div>
                      <div className="flex gap-2">
                        <input type="url" placeholder="أو أضف رابط صورة خارجي" value={editAdditionalUrlInput} onChange={e => setEditAdditionalUrlInput(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" dir="ltr" />
                        <button type="button" onClick={addEditAdditionalUrl} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium">إضافة</button>
                      </div>
                    </div>

                    {editingProduct.images && editingProduct.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {editingProduct.images.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group">
                            <img src={img} alt="Additional preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeEditAdditionalImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-bold bg-red-600 px-2 py-1 rounded">حذف</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المقاسات المتاحة</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="مثال: S, M, L, XL"
                        value={editSizesInput}
                        onChange={e => setEditSizesInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parts = editSizesInput.split(',').map(s => s.trim()).filter(Boolean);
                            setEditingProduct(prev => prev ? ({ ...prev, sizes: [...new Set([...(prev.sizes || []), ...parts])] }) : null);
                            setEditSizesInput("");
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium"
                      >
                        إضافة
                      </button>
                    </div>
                    {editingProduct.sizes && editingProduct.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editingProduct.sizes.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                            {s}
                            <button type="button" onClick={() => setEditingProduct(prev => prev ? ({ ...prev, sizes: (prev.sizes || []).filter((_, j) => j !== i) }) : null)} className="text-emerald-400 hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الألوان المتاحة</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="مثال: أحمر, أزرق, أسود"
                        value={editColorsInput}
                        onChange={e => setEditColorsInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parts = editColorsInput.split(',').map(s => s.trim()).filter(Boolean);
                            setEditingProduct(prev => prev ? ({ ...prev, colors: [...new Set([...(prev.colors || []), ...parts])] }) : null);
                            setEditColorsInput("");
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium"
                      >
                        إضافة
                      </button>
                    </div>
                    {editingProduct.colors && editingProduct.colors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editingProduct.colors.map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {c}
                            <button type="button" onClick={() => setEditingProduct(prev => prev ? ({ ...prev, colors: (prev.colors || []).filter((_, j) => j !== i) }) : null)} className="text-blue-400 hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المخزون المتوفر</label>
                    <input type="number" required min="0" value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                    <button type="submit" disabled={editUploadingImage || editUploadingAdditional} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium shadow-md shadow-blue-200 transition-colors">حفظ التغييرات</button>
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
                    
                    {(product.sizes && product.sizes.length > 0) && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">المقاسات: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.sizes.map((s, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(product.colors && product.colors.length > 0) && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500">الألوان: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.colors.map((c, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-600">المخزون: {product.stock}</span>
                      <div className="flex gap-1">
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingProduct(product);
                            setEditSizesInput("");
                            setEditColorsInput("");
                            setTimeout(() => {
                              const el = document.getElementById("edit-product-section");
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                              } else {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }, 50);
                          }}
                          className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="تعديل المنتج"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="حذف المنتج"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
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

        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">إعدادات الشحن</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto p-4 md:p-6">
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl mb-6 text-sm border border-yellow-200">
                <strong>تنبيه:</strong> لحفظ الأسعار بشكل دائم، يرجى التأكد من تشغيل كود SQL لإنشاء جدول `shipping_rates` في إعدادات Supabase كما هو موضح في المحادثة.
              </div>
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                    <th className="p-4 font-medium">رقم</th>
                    <th className="p-4 font-medium">الولاية</th>
                    <th className="p-4 font-medium">توصيل للمنزل (د.ج)</th>
                    <th className="p-4 font-medium">توصيل للمكتب (د.ج)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wilayas.map(wilaya => {
                    const rate = shippingRates.find(r => r.wilaya_id === wilaya.id.toString());
                    return (
                      <tr key={wilaya.id} className={`hover:bg-gray-50/50 ${!isWilayaSupported(wilaya.id.toString()) ? 'opacity-40 bg-gray-50' : ''}`}>
                        <td className="p-4 text-gray-500 font-medium">{wilaya.code}</td>
                        <td className="p-4 font-bold text-gray-900">
                          {wilaya.name_ar}
                          {getWilayaSupportType(wilaya.id.toString()) === 'full' && <span className="mr-2 text-emerald-500 text-xs" title="مدعومة بالكامل">✅</span>}
                          {getWilayaSupportType(wilaya.id.toString()) === 'home_only' && <span className="mr-2 text-amber-500 text-xs" title="توصيل للمنزل فقط">🏠</span>}
                          {getWilayaSupportType(wilaya.id.toString()) === 'none' && <span className="mr-2 text-red-500 text-xs" title="غير مدعومة">❌</span>}
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            value={rate?.home_price || 800}
                            onChange={(e) => handleShippingUpdate(wilaya.id.toString(), 'home', Number(e.target.value))}
                            disabled={!isWilayaSupported(wilaya.id.toString())}
                            className={`w-32 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 transition-all ${!isWilayaSupported(wilaya.id.toString()) ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'}`}
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            value={rate?.desk_price || 400}
                            onChange={(e) => handleShippingUpdate(wilaya.id.toString(), 'desk', Number(e.target.value))}
                            disabled={!isWilayaSupported(wilaya.id.toString())}
                            className={`w-32 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 transition-all ${!isWilayaSupported(wilaya.id.toString()) ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white'}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}