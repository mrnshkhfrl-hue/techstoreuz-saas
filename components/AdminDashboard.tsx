'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Save, AlertCircle, Cpu } from 'lucide-react';

/** Local type definitions (TradeInSku/TradeInPenalty removed from Prisma schema) */
interface TradeInSku {
  id: string;
  modelName: string;
  storage: string;
  basePrice: number;
}

interface TradeInPenalty {
  id: string;
  category: string;
  conditionName: string;
  penaltyType: 'FIXED' | 'PERCENTAGE';
  penaltyValue: number;
}

interface AdminDashboardProps {
  initialSkus: TradeInSku[];
  initialPenalties: TradeInPenalty[];
}

const tapSpring = { type: "spring" as const, stiffness: 400, damping: 17 };

// Компонент строки SKU
const SkuRow = ({ sku }: { sku: TradeInSku }) => {
  const [price, setPrice] = useState<number | ''>(sku.basePrice);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (price === '' || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/skus/${sku.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePrice: Number(price) }),
      });
      if (!res.ok) throw new Error('Ошибка');
    } catch (error) {
      alert('Ошибка при сохранении цены');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
      <td className="p-3 text-[13px] font-semibold text-white whitespace-nowrap">{sku.modelName}</td>
      <td className="p-3 text-[12px] text-white/50 whitespace-nowrap">
        <span className="bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-glass-xs text-white/70">{sku.storage}</span>
      </td>
      <td className="p-3 text-sm whitespace-nowrap w-40">
        <div className="flex items-center gap-2">
          <span className="text-white/30 font-medium text-[13px]">$</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-20 bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-2 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#007AFF]/50 transition-all font-bold"
            disabled={isSaving}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={tapSpring}
            onClick={handleSave}
            disabled={isSaving || price === sku.basePrice || price === ''}
            className={`
              w-7 h-7 rounded-full flex items-center justify-center transition-colors
              ${
                isSaving || price === sku.basePrice || price === ''
                  ? 'bg-white/[0.04] text-white/20 border border-white/[0.04]'
                  : 'bg-[#34C759]/20 text-[#34C759] hover:bg-[#34C759]/30 border border-[#34C759]/30'
              }
            `}
          >
            <Save size={13} />
          </motion.button>
        </div>
      </td>
    </tr>
  );
};

// Компонент строки штрафа
const PenaltyRow = ({ penalty }: { penalty: TradeInPenalty }) => {
  const [val, setVal] = useState<number | ''>(penalty.penaltyValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (val === '' || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/penalties/${penalty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penaltyValue: Number(val) }),
      });
      if (!res.ok) throw new Error('Ошибка');
    } catch (error) {
      alert('Ошибка при сохранении штрафа');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors">
      <td className="p-3 text-[13px] font-semibold text-white whitespace-nowrap">{penalty.category}</td>
      <td className="p-3 text-[12px] text-white/50 whitespace-nowrap">{penalty.conditionName}</td>
      <td className="p-3 text-[12px] whitespace-nowrap">
        <span className="bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/25 px-2 py-0.5 rounded-glass-xs text-[10px] font-bold tracking-wide uppercase">
          {penalty.penaltyType === 'FIXED' ? 'Фикс.' : 'Процент'}
        </span>
      </td>
      <td className="p-3 text-sm whitespace-nowrap w-40">
        <div className="flex items-center gap-2">
          {penalty.penaltyType === 'FIXED' && <span className="text-white/30 font-medium text-[13px]">$</span>}
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-16 bg-white/[0.02] border border-white/[0.08] rounded-glass-sm px-2 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#FF9500]/50 transition-all font-bold"
            disabled={isSaving}
          />
          {penalty.penaltyType === 'PERCENTAGE' && <span className="text-white/30 font-medium text-[13px]">%</span>}
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={tapSpring}
            onClick={handleSave}
            disabled={isSaving || val === penalty.penaltyValue || val === ''}
            className={`
              w-7 h-7 rounded-full flex items-center justify-center transition-colors
              ${
                isSaving || val === penalty.penaltyValue || val === ''
                  ? 'bg-white/[0.04] text-white/20 border border-white/[0.04]'
                  : 'bg-[#34C759]/20 text-[#34C759] hover:bg-[#34C759]/30 border border-[#34C759]/30'
              }
            `}
          >
            <Save size={13} />
          </motion.button>
        </div>
      </td>
    </tr>
  );
};

// Главный компонент Dashboard
export default function AdminDashboard({ initialSkus, initialPenalties }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'skus' | 'penalties'>('skus');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkus = initialSkus.filter((sku) =>
    sku.modelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="w-10 h-10 rounded-glass-btn bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF]">
          <Cpu size={20} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight tracking-tight">
            Калькулятор Trade-In
          </h2>
          <p className="text-[11px] text-white/30">
            Управление прайс-листом и вычетами
          </p>
        </div>
      </div>

      <div className="rounded-glass bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] overflow-hidden flex flex-col">
        {/* Навигация (Tabs) */}
        <div className="flex bg-white/[0.02] p-1 gap-1 m-3 rounded-[16px] border border-white/[0.06] relative">
          <button
            onClick={() => setActiveTab('skus')}
            className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-bold transition-all relative z-10 cursor-pointer ${
              activeTab === 'skus'
                ? 'bg-white text-black shadow-md shadow-white/10'
                : 'bg-white/[0.02] text-white/40 hover:text-white/60'
            }`}
          >
            Базовые цены
          </button>
          <button
            onClick={() => setActiveTab('penalties')}
            className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-bold transition-all relative z-10 cursor-pointer ${
              activeTab === 'penalties'
                ? 'bg-white text-black shadow-md shadow-white/10'
                : 'bg-white/[0.02] text-white/40 hover:text-white/60'
            }`}
          >
            Штрафы
          </button>
        </div>

        <div className="p-4 pt-1 flex-1 overflow-x-auto">
          {/* Вкладка SKU */}
          {activeTab === 'skus' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по модели (например, 15 Pro)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-glass-sm focus:border-[#007AFF]/50 outline-none transition-all text-[13px] text-white placeholder:text-white/30 backdrop-blur-xl"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
              </div>

              <div className="rounded-glass-sm border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[320px]">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/[0.08]">
                      <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Модель</th>
                      <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Память</th>
                      <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkus.length > 0 ? (
                      filteredSkus.map((sku) => <SkuRow key={sku.id} sku={sku} />)
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-white/30 text-[13px]">
                          Модели не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Вкладка Штрафов */}
          {activeTab === 'penalties' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="rounded-glass-sm border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/[0.08]">
                      <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Категория</th>
                      <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Дефект</th>
                      <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Тип</th>
                      <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Вычет</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialPenalties.length > 0 ? (
                      initialPenalties.map((penalty) => (
                        <PenaltyRow key={penalty.id} penalty={penalty} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-white/30 text-[13px]">
                          Штрафы не настроены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
