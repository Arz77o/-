import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Facebook, Instagram, MessageCircle, Menu, X } from "lucide-react";
import { STORE_CONFIG } from "../lib/config";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "الرئيسية", path: "/" },
    { name: "المنتجات", path: "/#products" },
  ];

  useEffect(() => {
    if (location.hash === "#products") {
      const element = document.getElementById("products-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const isLinkActive = (path: string) => {
    if (path.includes("#products")) {
      return location.pathname === "/" && location.hash === "#products";
    }
    return location.pathname === "/" && location.hash === "";
  };

  const activeClass = (path: string) => 
    isLinkActive(path)
      ? "text-emerald-600 font-semibold border-b-2 border-emerald-600" 
      : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50 md:hover:bg-transparent font-medium";

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm" dir="rtl">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 group">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-105">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="tracking-tight hover:text-emerald-600 transition-colors">{STORE_CONFIG.name}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`py-5 px-1 transition-all text-sm ${activeClass(link.path)}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Social Media Links (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <a 
              href={STORE_CONFIG.socials.facebook} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
              title="فيسبوك"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href={STORE_CONFIG.socials.instagram} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-all"
              title="إنستغرام"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href={STORE_CONFIG.socials.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all"
              title="واتساب"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            {/* Quick WhatsApp Shortcut for Mobile */}
            <a 
              href={STORE_CONFIG.socials.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-3 px-4 rounded-xl transition-all text-base ${
                  isLinkActive(link.path)
                    ? "bg-emerald-50 text-emerald-700 font-bold" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Social Media Row in Mobile Menu */}
            <div className="pt-4 pb-2 border-t border-gray-50 flex items-center justify-around">
              <a 
                href={STORE_CONFIG.socials.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-medium w-[30%]"
              >
                <Facebook className="w-4 h-4" />
                <span>فيسبوك</span>
              </a>
              <a 
                href={STORE_CONFIG.socials.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all text-sm font-medium w-[30%]"
              >
                <Instagram className="w-4 h-4" />
                <span>إنستغرام</span>
              </a>
              <a 
                href={STORE_CONFIG.socials.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-sm font-bold w-[30%]"
              >
                <MessageCircle className="w-4 h-4 fill-current text-emerald-600" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
