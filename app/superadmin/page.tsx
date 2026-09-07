"use client";

import { useEffect, useState } from "react";
import { Plus, Settings, Trash2, Edit2, Link as LinkIcon, Save, X } from "lucide-react";

import SuperAdminAuthWrapper from "@/components/SuperAdminAuthWrapper";

interface Shop {
  id: string;
  name: string;
  slug: string;
  botToken: string | null;
  botUsername: string | null;
  createdAt: string;
  _count: {
    products: number;
    orders: number;
  };
}

function SuperAdminContent() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editShopId, setEditShopId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");

  const fetchShops = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || "";
      const currentId = tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "";
      const res = await fetch("/api/superadmin/shops", {
        headers: {
          "X-Init-Data": initData,
          "X-Admin-Id": currentId,
        }
      });
      if (res.ok) {
        const data = await res.json();
        setShops(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || "";
      
      const url = editShopId ? `/api/superadmin/shops/${editShopId}` : "/api/superadmin/shops";
      const method = editShopId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Init-Data": initData
        },
        body: JSON.stringify({ name, slug, botToken, botUsername })
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setEditShopId(null);
        setName("");
        setSlug("");
        setBotToken("");
        setBotUsername("");
        fetchShops();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditShopId(shop.id);
    setName(shop.name);
    setSlug(shop.slug);
    setBotToken(shop.botToken || "");
    setBotUsername(shop.botUsername || "");
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить магазин? Все его данные будут удалены безвозвратно!")) return;
    
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || "";
      const res = await fetch(`/api/superadmin/shops/${id}`, {
        method: "DELETE",
        headers: { "X-Init-Data": initData }
      });
      if (res.ok) fetchShops();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="p-6 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#007AFF]/30 border-t-[#007AFF] animate-spin" />
          <span className="text-sm text-white/60 font-semibold tracking-wide">Загрузка данных платформы...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-black text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">SaaS Dashboard</h1>
          <p className="text-white/40 mt-1 text-sm">Управление магазинами платформы</p>
        </div>
        <button
          onClick={() => {
            setEditShopId(null);
            setName("");
            setSlug("");
            setBotToken("");
            setBotUsername("");
            setShowAddForm(!showAddForm);
          }}
          className="bg-white text-black px-5 py-2.5 rounded-glass-btn font-bold flex items-center gap-2 hover:bg-white/90 transition-colors shadow-md shadow-white/10 cursor-pointer"
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
          {showAddForm ? "Отмена" : "Новый магазин"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSave} className="p-6 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] mb-8 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-white">{editShopId ? "Редактирование магазина" : "Создание нового магазина"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Название магазина</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm p-3 text-sm text-white outline-none focus:border-[#007AFF]/50 font-medium" placeholder="Apple Store" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Ссылка (Slug) - уникальная</label>
              <input required value={slug} onChange={e => setSlug(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm p-3 text-sm text-white outline-none focus:border-[#007AFF]/50 font-medium" placeholder="apple-store" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Bot Token (BotFather)</label>
              <input value={botToken} onChange={e => setBotToken(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm p-3 text-sm text-white outline-none focus:border-[#007AFF]/50 font-medium" placeholder="123456789:ABCdef..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Bot Username (без @)</label>
              <input value={botUsername} onChange={e => setBotUsername(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-glass-sm p-3 text-sm text-white outline-none focus:border-[#007AFF]/50 font-medium" placeholder="my_shop_bot" />
            </div>
          </div>
          <button type="submit" className="btn-system-blue px-6 py-3 rounded-glass-btn font-bold flex items-center gap-2 cursor-pointer">
            <Save size={18} />
            {editShopId ? "Сохранить изменения" : "Создать магазин"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map(shop => (
          <div key={shop.id} className="p-5 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-white">{shop.name}</h3>
                  <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                    <LinkIcon size={13} className="text-[#007AFF]" /> {shop.slug}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleEdit(shop)} className="p-2 text-white/50 hover:text-white bg-white/[0.03] border border-white/[0.06] rounded-glass-xs transition-colors cursor-pointer"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(shop.id)} className="p-2 text-[#FF3B30] hover:text-[#FF3B30]/80 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-glass-xs transition-colors cursor-pointer"><Trash2 size={15} /></button>
                </div>
              </div>
              
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-[14px] p-3 mb-4 text-xs font-mono text-white/40 break-all overflow-hidden h-11 flex items-center">
                {shop.botToken ? (shop.botToken.substring(0, 20) + "...") : "Токен не указан"}
              </div>
            </div>
            
            <div className="flex justify-between border-t border-white/[0.06] pt-3">
              <div className="text-center w-1/2 border-r border-white/[0.06]">
                <div className="text-xl font-black text-white">{shop._count.products}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Товаров</div>
              </div>
              <div className="text-center w-1/2">
                <div className="text-xl font-black text-white">{shop._count.orders}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Заказов</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <SuperAdminAuthWrapper>
      <SuperAdminContent />
    </SuperAdminAuthWrapper>
  );
}
