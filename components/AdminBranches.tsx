"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Phone,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
};

type AdminBranchesProps = {
  shopId: string;
  initialBranches?: Branch[];
};

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

export default function AdminBranches({
  shopId,
  initialBranches = [],
}: AdminBranchesProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("+998 77 285-99-99");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          name,
          address,
          phone,
        }),
      });
      const data = await res.json();
      if (data.ok && data.branch) {
        setBranches((prev) => [...prev, data.branch]);
        setName("");
        setAddress("");
        setPhone("+998 77 285-99-99");
        setIsAdding(false);
        setFeedback("Филиал успешно добавлен!");
      } else {
        setFeedback(data.error || "Ошибка создания филиала");
      }
    } catch (err: any) {
      setFeedback(err.message || "Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm("Удалить этот филиал?")) return;
    try {
      const res = await fetch(`/api/admin/branches?id=${branchId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setBranches((prev) => prev.filter((b) => b.id !== branchId));
      } else {
        alert(data.error || "Ошибка удаления");
      }
    } catch (err: any) {
      alert(err.message || "Ошибка соединения");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Store size={18} className="text-[#007AFF]" />
            <span>Филиалы магазина</span>
          </h2>
          <p className="text-xs text-white/50">
            Управление точками самовывоза и продаж в Самарканде
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={tapSpring}
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-[#007AFF]/25 cursor-pointer transition-all"
        >
          <Plus size={14} />
          <span>{isAdding ? "Отмена" : "Добавить филиал"}</span>
        </motion.button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
          {feedback}
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <form
          onSubmit={handleAddBranch}
          className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
            Новый филиал
          </h3>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-white/50 block mb-1">
                Название филиала
              </label>
              <input
                type="text"
                placeholder="Филиал №1 (Главный)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/50 block mb-1">
                Адрес и часы работы
              </label>
              <input
                type="text"
                placeholder="г. Самарканд, ул. Гульабад, 1 (09:00 - 21:00)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/50 block mb-1">
                Контактный телефон
              </label>
              <input
                type="text"
                placeholder="+998 77 285-99-99"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#007AFF]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl bg-white/5 text-xs text-white/70 hover:bg-white/10"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-[#007AFF] text-xs font-bold text-white hover:bg-[#007AFF]/90 disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      )}

      {/* Branch list */}
      <div className="space-y-3">
        {branches.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/40">
            Филиалы еще не добавлены
          </div>
        ) : (
          branches.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-all flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {b.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/25">
                    Активен
                  </span>
                </div>

                <p className="text-xs text-white/70 flex items-start gap-1.5">
                  <MapPin size={13} className="text-[#007AFF] shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </p>

                {b.phone && (
                  <p className="text-xs text-white/50 flex items-center gap-1.5">
                    <Phone size={12} className="text-white/40" />
                    <span>{b.phone}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDeleteBranch(b.id)}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/5 transition-all cursor-pointer"
                title="Удалить филиал"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
