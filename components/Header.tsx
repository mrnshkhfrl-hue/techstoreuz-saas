import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useCurrency } from "@/providers/CurrencyProvider";

interface HeaderProps {
  activeTab: "shop" | "profile" | "bookings";
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  language: "ru" | "uz";
  setLanguage: (lang: "ru" | "uz") => void;
  onCartClick: () => void;
  search: string;
  setSearch: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
}

export default function Header({ 
  activeTab, activeCategory, onCategoryChange, language, setLanguage, onCartClick, search, setSearch, sortBy, setSortBy 
}: HeaderProps) {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const scrollRef = useDragScroll();
  const { currency, toggleCurrency } = useCurrency();

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  const categoriesData = [
    { id: "all", ru: "Все", uz: "Barchasi" },
    { id: "phone", ru: "iPhone", uz: "iPhone" },
    { id: "audio", ru: "Аудио", uz: "Audio" },
    { id: "gaming", ru: "Гейминг", uz: "Geyming" },
    { id: "watch", ru: "Watch", uz: "Watch" },
    { id: "mac", ru: "Mac", uz: "Mac" },
  ];

  const sortOptions = [
    { id: "newest", ru: "Сначала новые", uz: "Yangilari" },
    { id: "popular", ru: "Популярные", uz: "Ommabop" },
    { id: "price_asc", ru: "Сначала дешевле", uz: "Arzonlari" },
    { id: "price_desc", ru: "Сначала дороже", uz: "Qimmatlari" },
  ];

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 bg-black/5 dark:bg-white/5 backdrop-blur-md text-gray-900 dark:text-white pb-3 border-b border-black/10 dark:border-white/20 shadow-lg">
      {/* Top Bar: Logo & Actions */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {process.env.NEXT_PUBLIC_STORE_LOGO && (
            <img src={process.env.NEXT_PUBLIC_STORE_LOGO} alt="Store Logo" className="w-8 h-8 rounded-full object-cover shadow-sm border border-black/10 dark:border-white/10" />
          )}
           <h1 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">{process.env.NEXT_PUBLIC_STORE_NAME || "Store"}<span className="text-[#007AFF]">.</span></h1>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Address Link */}
          <button className="h-9 px-3 liquid-btn text-[13px] font-semibold text-gray-600 dark:text-gray-300">
             {language === 'ru' ? 'Адрес' : 'Manzil'}
          </button>

          {/* Currency Toggle */}
          <button 
            onClick={toggleCurrency}
            className="h-9 px-3 liquid-btn text-[13px] font-bold text-gray-600 dark:text-gray-300 mr-1"
          >
            {currency === "USD" ? "$" : "UZS"}
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center liquid-btn text-gray-600 dark:text-gray-300"
          >
            {resolvedTheme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="18.36" x2="5.64" y2="16.92"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {/* Cart Icon */}
          <button onClick={onCartClick} className="w-10 h-10 rounded-xl bg-[#007AFF] flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-white">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </button>
        </div>
      </div>
      
      {activeTab === "shop" && (
        <>
          {/* Search Row */}
          <div className="px-4 pb-2">
            <div className="flex gap-2 items-center relative" ref={filterRef}>
              <div className="relative flex-grow">
                <input 
                  placeholder={language === "ru" ? "Поиск..." : "Qidiruv..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full py-2.5 px-10 bg-gray-100 dark:bg-white/5 rounded-xl outline-none font-medium text-[13px] border border-transparent dark:border-white/5 focus:bg-gray-200 dark:focus:bg-white/10 transition-all placeholder-gray-500 text-gray-900 dark:text-white"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`w-10 h-10 flex items-center justify-center liquid-btn ${showFilters ? "bg-[#007AFF] text-white border-transparent shadow-md" : "text-gray-400"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              </button>

              {/* Context Filter Menu */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[50px] right-0 w-48 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col py-1"
                  >
                    {sortOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id); setShowFilters(false); }}
                        className={`py-3 px-4 text-left text-[11px] font-bold transition-all ${sortBy === opt.id ? "bg-[#007AFF]/10 text-[#007AFF]" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"}`}
                      >
                        {language === "ru" ? opt.ru : opt.uz}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Categories Row — Segmented Navigation */}
          <div className="px-4 pt-2">
            <div ref={scrollRef} className="flex gap-1 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden pb-2 bg-black/5 dark:bg-white/5 p-1 rounded-[28px]">
              {categoriesData.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-[14px] font-semibold transition-all duration-300 ${
                    activeCategory === cat.id 
                      ? "bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  {language === "ru" ? cat.ru : cat.uz}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
