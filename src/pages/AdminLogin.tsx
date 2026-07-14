import React, { useState, useEffect } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, ExternalLink } from "lucide-react";

export default function AdminLogin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isIframe = window.self !== window.top;

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          if (result.user.email !== 'abdouarbouz56@gmail.com') {
            await auth.signOut();
            setError("هذا الحساب ليس لديه صلاحيات الإدارة.");
          } else {
            navigate("/admin");
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "حدث خطأ أثناء تسجيل الدخول عبر التوجيه.");
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      if (isIframe) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        
        if (result.user.email !== 'abdouarbouz56@gmail.com') {
          await auth.signOut();
          setError("هذا الحساب ليس لديه صلاحيات الإدارة.");
          setLoading(false);
          return;
        }

        navigate("/admin");
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
          <Lock className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول للإدارة</h1>
        <p className="text-sm text-gray-500 mb-8">يتم تسجيل الدخول باستخدام حساب جوجل الخاص بك</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-right" dir="ltr">
            {error}
          </div>
        )}

        {isIframe && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm flex flex-col items-center gap-2">
            <p>أنت تستخدم التطبيق داخل نافذة العرض (Preview). قد لا يعمل تسجيل الدخول بجوجل هنا بسبب قيود المتصفح.</p>
            <a 
              href={window.location.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-700 font-bold hover:underline mt-2"
            >
              <ExternalLink className="w-4 h-4" />
              افتح التطبيق في علامة تبويب جديدة
            </a>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center h-12"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تسجيل الدخول باستخدام Google"}
        </button>
      </div>
    </div>
  );
}
