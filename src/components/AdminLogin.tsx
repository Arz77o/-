import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FiLoader } from "react-icons/fi";
import { HiOutlineLockClosed } from "react-icons/hi";

interface AdminLoginProps {
  onLoginSuccess?: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
      } else if (session) {
        if (session.user.email !== 'abdouarbouz56@gmail.com') {
          supabase.auth.signOut().then(() => {
            setError("هذا الحساب ليس لديه صلاحيات الإدارة.");
          });
        } else {
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            window.location.href = "/admin";
          }
        }
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user?.email !== 'abdouarbouz56@gmail.com') {
        await supabase.auth.signOut();
        setError("هذا الحساب ليس لديه صلاحيات الإدارة.");
        setLoading(false);
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.href = "/admin";
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "حدث خطأ أثناء تسجيل الدخول.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiOutlineLockClosed className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول للإدارة</h1>
        <p className="text-sm text-gray-500 mb-8">أدخل البريد الإلكتروني وكلمة المرور الخاصة بك</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-right" dir="ltr">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-right">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all text-left"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white outline-none transition-all text-left"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center h-12 mt-6"
          >
            {loading ? <FiLoader className="w-5 h-5 animate-spin" /> : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}