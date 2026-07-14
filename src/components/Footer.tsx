import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle, ShieldCheck, Mail, Phone, ShoppingBag } from "lucide-react";
import { STORE_CONFIG } from "../lib/config";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto" dir="rtl">
      {/* Top Footer Section */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span>{STORE_CONFIG.name}</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              {STORE_CONFIG.description}
            </p>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-xl text-xs font-semibold w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>الدفع عند الاستلام مع معاينة المنتج</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 tracking-wider">صفحات هامة</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-gray-500 hover:text-emerald-600 transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-500 hover:text-emerald-600 transition-colors">
                  سياسة الإسترجاع و الإستبدال
                </Link>
              </li>
              <li>
                <Link to="/terms-conditions" className="text-gray-500 hover:text-emerald-600 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Socials */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 tracking-wider">تابعنا على</h4>
            
            {/* Social Media Row */}
            <div className="flex items-center gap-3">
              <a 
                href={STORE_CONFIG.socials.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href={STORE_CONFIG.socials.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-all"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href={STORE_CONFIG.socials.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright Section */}
      <div className="bg-gray-50 py-6 border-t border-gray-100 text-center text-xs text-gray-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {currentYear} {STORE_CONFIG.name}. جميع الحقوق محفوظة.</p>
          <p className="opacity-75">صنع بكل حب للتسوق الممتع والآمن</p>
        </div>
      </div>
    </footer>
  );
}
