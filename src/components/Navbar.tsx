/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { HiOutlineShoppingBag, HiMenu, HiX } from "react-icons/hi";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { STORE_CONFIG } from "../lib/config";

interface NavbarProps {
  currentPath?: string;
}

export default function Navbar({ currentPath = "/" }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    setCurrentHash(window.location.hash);
  }, []);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navLinks = [
    { name: "الرئيسية", path: "/" },
    { name: "المنتجات", path: "/#products" },
  ];

  useEffect(() => {
    if (currentHash === "#products") {
      const element = document.getElementById("products-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [currentHash]);

  const isLinkActive = (path: string) => {
    if (path.includes("#products")) {
      return currentPath === "/" && currentHash === "#products";
    }
    return currentPath === "/" && currentHash === "";
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
          <a href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 group">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-105">
              <HiOutlineShoppingBag className="w-5 h-5" />
            </div>
            <span className="tracking-tight hover:text-emerald-600 transition-colors">{STORE_CONFIG.name}</span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.path} 
                href={link.path} 
                className={`py-5 px-1 transition-all text-sm ${activeClass(link.path)}`}
              >
                {link.name}
              </a>
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
              <FaFacebook className="w-4 h-4" />
            </a>
            <a 
              href={STORE_CONFIG.socials.instagram} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-all"
              title="إنستغرام"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
            <a 
              href={STORE_CONFIG.socials.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all"
              title="واتساب"
            >
              <FaWhatsapp className="w-4 h-4" />
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
              <FaWhatsapp className="w-4 h-4" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-3 px-4 rounded-xl transition-all text-base ${
                  isLinkActive(link.path)
                    ? "bg-emerald-50 text-emerald-700 font-bold" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                }`}
              >
                {link.name}
              </a>
            ))}

            {/* Social Media Row in Mobile Menu */}
            <div className="pt-4 pb-2 border-t border-gray-50 flex items-center justify-around">
              <a 
                href={STORE_CONFIG.socials.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-medium w-[30%]"
              >
                <FaFacebook className="w-4 h-4" />
                <span>فيسبوك</span>
              </a>
              <a 
                href={STORE_CONFIG.socials.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all text-sm font-medium w-[30%]"
              >
                <FaInstagram className="w-4 h-4" />
                <span>إنستغرام</span>
              </a>
              <a 
                href={STORE_CONFIG.socials.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-sm font-bold w-[30%]"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}