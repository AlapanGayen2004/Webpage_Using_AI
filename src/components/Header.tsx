import React, { useState } from "react";
import { ShoppingBag, Shield, User, Sun, Moon, Sparkles, Sliders, Languages, Eye } from "lucide-react";
import { User as UserType } from "../types";

interface HeaderProps {
  currentLanguage: "en" | "es" | "fr";
  setLanguage: (lang: "en" | "es" | "fr") => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  fontSize: "sm" | "base" | "lg";
  setFontSize: (size: "sm" | "base" | "lg") => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  currentUser: UserType | null;
  setCurrentUser: (u: UserType | null) => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  cartCount: number;
}

const translations = {
  en: {
    tagline: "CURATED FOR MODERN LIFE",
    store: "eShop",
    login: "Sign In",
    logout: "Sign Out",
    admin: "Admin Hub",
    shop: "Shop",
  },
  es: {
    tagline: "CURADO PARA LA VIDA MODERNA",
    store: "eShop",
    login: "Ingresar",
    logout: "Salir",
    admin: "Portal Admin",
    shop: "Tienda",
  },
  fr: {
    tagline: "SÉLECTIONNÉ POUR LA VIE MODERNE",
    store: "eShop",
    login: "Connexion",
    logout: "Déconnexion",
    admin: "Espace Admin",
    shop: "Boutique",
  },
};

export default function Header({
  currentLanguage,
  setLanguage,
  darkMode,
  setDarkMode,
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  currentUser,
  setCurrentUser,
  onOpenCart,
  onOpenAdmin,
  onOpenAuth,
  cartCount,
}: HeaderProps) {
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const t = translations[currentLanguage];

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("eshop_user");
    localStorage.removeItem("eshop_token");
  };

  return (
    <header className={`border-b w-full transition-colors duration-200 ${
      highContrast 
        ? "bg-white text-black border-black" 
        : darkMode 
          ? "bg-slate-900 border-slate-800 text-slate-100" 
          : "bg-stone-50 border-stone-200/80 text-stone-800"
    }`}>
      {/* Promo Bar */}
      <div className={`text-center py-1.5 text-xs tracking-widest font-medium border-b ${
        highContrast 
          ? "bg-black text-white" 
          : "bg-stone-900 text-stone-200 dark:bg-stone-950 dark:text-stone-300"
      }`}>
        {t.tagline} • <span className="text-yellow-400 font-bold">20% OFF ALL ITEMS</span> CODE: <span className="underline select-all">SAVE20</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className={`p-1.5 rounded-lg flex items-center justify-center ${
            highContrast ? "bg-black text-white" : "bg-stone-900 text-stone-50 dark:bg-amber-500 dark:text-slate-950"
          }`}>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-sans text-xl font-semibold tracking-tight uppercase">
            {t.store}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          
          {/* Preferences Button */}
          <button
            id="accessibility-options-btn"
            onClick={() => setShowConfigMenu(!showConfigMenu)}
            className={`p-2 rounded-lg relative hover:bg-stone-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
            title="Accessibility & Language Preferences"
          >
            <Sliders className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </button>

          {/* Quick Admin Hub link if authorized */}
          {currentUser?.role === "admin" && (
            <button
              id="admin-hub-tab-btn"
              onClick={onOpenAdmin}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium text-xs tracking-wider uppercase border border-amber-500/20 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t.admin}</span>
            </button>
          )}

          {/* Profile User Session button */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold">{currentUser.name}</p>
                <p className="text-[10px] text-stone-400 dark:text-slate-500 capitalize">{currentUser.role}</p>
              </div>
              <button
                id="user-profile-avatar-btn"
                onClick={currentUser.role === "admin" ? onOpenAdmin : undefined}
                className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/30 cursor-pointer hover:ring-2 hover:ring-amber-400"
              >
                <img referrerPolicy="no-referrer" src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              </button>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="text-xs font-medium text-red-500 hover:text-red-600 underline cursor-pointer"
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <button
              id="signin-btn"
              onClick={onOpenAuth}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg cursor-pointer font-medium text-xs tracking-wider uppercase transition-all ${
                highContrast 
                  ? "border-2 border-black hover:bg-black hover:text-white"
                  : "bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t.login}</span>
            </button>
          )}

          {/* Cart Quick view slide indicator */}
          <button
            id="cart-floating-trigger-btn"
            onClick={onOpenCart}
            className={`p-2.5 rounded-lg relative cursor-pointer hover:bg-stone-200/50 dark:hover:bg-slate-800 transition-all ${
              highContrast ? "border border-black bg-black text-white" : ""
            }`}
            title="Open Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce ${
                highContrast ? "bg-white text-black border border-black" : "bg-red-500 text-white"
              }`}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Preference Drawer Details */}
      {showConfigMenu && (
        <div className={`border-t py-4 animate-fade-in ${
          highContrast ? "bg-white text-black border-black" : "bg-stone-100 dark:bg-slate-950 text-stone-700 dark:text-slate-200"
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Language Selector */}
            <div>
              <label className="text-[10px] tracking-widest font-bold text-stone-400 dark:text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                <Languages className="w-3.5 h-3.5" /> Language / Idioma / Langue
              </label>
              <div className="flex space-x-1.5">
                {(["en", "es", "fr"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`font-semibold cursor-pointer text-xs px-3 py-1.5 rounded-md uppercase transition-all ${
                      currentLanguage === lang
                        ? highContrast
                          ? "bg-black text-white"
                          : "bg-stone-900 text-white dark:bg-amber-500 dark:text-slate-950"
                        : "bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-stone-300"
                    }`}
                  >
                    {lang === "en" ? "EN" : lang === "es" ? "ES" : "FR"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark & Light Theme */}
            <div>
              <label className="text-[10px] tracking-widest font-bold text-stone-400 dark:text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                <Sun className="w-3.5 h-3.5" /> Color Palette
              </label>
              <button
                id="toggle-dark-mode-preference"
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center space-x-2 text-xs px-4 py-1.5 rounded-md bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-100 hover:bg-stone-300 dark:hover:bg-slate-700 font-medium cursor-pointer"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-yellow-400" />
                    <span>Light Mode Theme</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Eye Safe Dark Theme</span>
                  </>
                )}
              </button>
            </div>

            {/* Accessible Adjust sizes */}
            <div>
              <label className="text-[10px] tracking-widest font-bold text-stone-400 dark:text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5" /> Text Readable Size
              </label>
              <div className="flex space-x-1">
                {(["sm", "base", "lg"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`text-[11px] font-semibold cursor-pointer px-2.5 py-1.5 rounded uppercase ${
                      fontSize === size
                        ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-slate-950"
                        : "bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-stone-300"
                    }`}
                  >
                    {size === "sm" ? "Compact" : size === "base" ? "Standard" : "Accessible Large"}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Mode */}
            <div>
              <label className="text-[10px] tracking-widest font-bold text-stone-400 dark:text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                <Shield className="w-3.5 h-3.5" /> Accessibility contrast
              </label>
              <button
                id="toggle-high-contrast"
                onClick={() => setHighContrast(!highContrast)}
                className={`text-xs px-4 py-1.5 rounded-md font-medium cursor-pointer transition-all ${
                  highContrast
                    ? "bg-black text-white hover:bg-stone-800"
                    : "bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-stone-300"
                }`}
              >
                {highContrast ? "Disable High Contrast" : "Enable High Contrast (WCAG)"}
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
