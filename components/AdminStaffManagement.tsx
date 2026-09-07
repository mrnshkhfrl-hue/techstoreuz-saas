"use client";

import { useState } from "react";
import { UserCheck, UserPlus, Trash2, Shield, Crown, Phone, Send, AlertCircle } from "lucide-react";

interface StaffUser {
  id: string;
  name: string | null;
  phone: string | null;
  telegramId: string;
}

interface ShopAdminItem {
  id: string;
  role: string;
  user: StaffUser;
}

interface AdminStaffManagementProps {
  shopId: string;
  currentAdminId: string;
  owner: StaffUser | null;
  initialAdmins: ShopAdminItem[];
}

export default function AdminStaffManagement({
  shopId,
  currentAdminId,
  owner,
  initialAdmins,
}: AdminStaffManagementProps) {
  const [admins, setAdmins] = useState<ShopAdminItem[]>(initialAdmins || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [targetTelegramId, setTargetTelegramId] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetPhone, setTargetPhone] = useState("");
  const [role, setRole] = useState("MANAGER");

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTelegramId.trim()) {
      setError("Укажите Telegram ID нового администратора");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          adminId: currentAdminId,
          targetTelegramId: targetTelegramId.trim(),
          targetName: targetName.trim(),
          targetPhone: targetPhone.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось добавить администратора");
      }

      // Add or update in list
      setAdmins((prev) => {
        const filtered = prev.filter((a) => a.id !== data.admin.id);
        return [...filtered, data.admin];
      });

      // Reset form
      setTargetTelegramId("");
      setTargetName("");
      setTargetPhone("");
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (staffId: string, adminName: string) => {
    if (!confirm(`Удалить администратора ${adminName} из команды магазина?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/staff?shopId=${shopId}&adminId=${currentAdminId}&staffId=${staffId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Не удалось удалить");
      }

      setAdmins((prev) => prev.filter((a) => a.id !== staffId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-5 pb-10 font-sans">
      {/* ── Title & Intro ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Команда магазина
          </h2>
          <p className="text-xs text-white/50">
            Управление администраторами и менеджерами вашего магазина
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#007AFF]/25 transition-all cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Добавить</span>
          </button>
        )}
      </div>

      {/* ── Add Admin Form ── */}
      {showAddForm && (
        <form
          onSubmit={handleAddAdmin}
          className="p-5 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus size={16} className="text-[#007AFF]" />
              Новый администратор
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
              className="text-xs text-white/40 hover:text-white"
            >
              Отмена
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1">
                Telegram ID * (обязательно)
              </label>
              <input
                type="text"
                required
                value={targetTelegramId}
                onChange={(e) => setTargetTelegramId(e.target.value)}
                placeholder="например: 123456789"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#007AFF]"
              />
              <p className="text-[10px] text-white/30 mt-1">
                Сотрудник может узнать свой ID в Telegram через бота @userinfobot
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-white/60 mb-1">
                  Имя сотрудника
                </label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="Имя"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/60 mb-1">
                  Телефон
                </label>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="+998..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-[#007AFF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/60 mb-1">
                Роль
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-white/10 text-white text-xs focus:outline-none focus:border-[#007AFF]"
              >
                <option value="MANAGER">Менеджер (товары и брони)</option>
                <option value="OWNER">Совладелец</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#007AFF]/25"
          >
            {loading ? "Сохранение..." : "Сохранить и предоставить доступ"}
          </button>
        </form>
      )}

      {/* ── 1. Store Owner Card ── */}
      <div className="p-4 rounded-[22px] bg-gradient-to-br from-[#FF9500]/15 via-white/[0.02] to-transparent border border-[#FF9500]/30 backdrop-blur-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF9500]/20 border border-[#FF9500]/30 flex items-center justify-center text-[#FF9500]">
              <Crown size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {owner?.name || "Владелец магазина"}
              </h3>
              <p className="text-[11px] text-white/40 font-mono">
                ID: {owner?.telegramId || currentAdminId}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#FF9500]/20 text-[#FF9500] text-[10px] font-extrabold uppercase tracking-wide border border-[#FF9500]/30">
            Владелец
          </span>
        </div>

        {owner?.phone && (
          <div className="pt-1 flex items-center gap-1.5 text-xs text-white/60">
            <Phone size={12} className="text-[#34C759]" />
            <span>{owner.phone}</span>
          </div>
        )}
      </div>

      {/* ── 2. Staff List ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider px-1">
          Администраторы магазина ({admins.length})
        </h3>

        {admins.length === 0 ? (
          <div className="p-6 rounded-[22px] bg-white/[0.02] border border-white/[0.05] text-center space-y-2">
            <UserCheck size={28} className="mx-auto text-white/20" />
            <p className="text-xs text-white/40">
              Пока нет добавленных администраторов
            </p>
            <p className="text-[11px] text-white/30 max-w-xs mx-auto">
              Вы можете добавить менеджера по его Telegram ID, чтобы он мог обрабатывать брони и управлять наличием устройств.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {admins.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-[20px] bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF]">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {item.user?.name || "Менеджер"}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono">
                      <span>ID: {item.user?.telegramId}</span>
                      {item.user?.phone && <span>• {item.user.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold uppercase">
                    {item.role === "OWNER" ? "Совладелец" : "Менеджер"}
                  </span>
                  <button
                    onClick={() =>
                      handleDeleteAdmin(item.id, item.user?.name || item.user?.telegramId)
                    }
                    className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                    title="Удалить из команды"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
