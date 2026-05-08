/**
 * DashboardAnalytics — Charts & summary cards for the Dashboard.
 *
 * 1. Summary stat cards (Total Trips, Total Expenses, Remaining Budget)
 * 2. Expense breakdown pie chart (by category, aggregated across all trips)
 * 3. Budget vs Actual bar chart (per-trip comparison)
 *
 * Uses Recharts (already a project dependency via BudgetTracker).
 */

import { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Plane, DollarSign, Wallet, AlertTriangle,
  TrendingUp, PieChart as PieChartIcon, BarChart2,
} from 'lucide-react';

/* ═══════════════════════════════════════
   Constants
   ═══════════════════════════════════════ */

const CATEGORY_COLORS = {
  Food: '#EF4444',
  Transport: '#3B82F6',
  Hotel: '#8B5CF6',
  Activities: '#F59E0B',
  Shopping: '#EC4899',
  Other: '#6B7280',
};

const PIE_COLORS = ['#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6B7280'];

/* ═══════════════════════════════════════
   Custom Tooltips
   ═══════════════════════════════════════ */

function PieTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: data } = payload[0];
  return (
    <div
      className="bg-navy text-white px-4 py-2 rounded-xl"
      style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <p className="font-semibold mb-0.5">{name}</p>
      <p>₹{value.toLocaleString()} ({data.pct}%)</p>
    </div>
  );
}

function BarTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-navy text-white px-4 py-2.5 rounded-xl"
      style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <p className="font-semibold mb-1 text-white/70 text-[10px] uppercase tracking-wider">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.dataKey === 'budget' ? 'Budget' : 'Spent'}: ₹{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   Custom Pie Label
   ═══════════════════════════════════════ */

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

/* ═══════════════════════════════════════
   Skeleton placeholder
   ═══════════════════════════════════════ */

function ChartSkeleton({ height = 200 }) {
  return (
    <div
      className="bg-border-light rounded-2xl animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <div className="w-10 h-10 rounded-full border-3 border-border border-t-text-muted animate-spin" />
    </div>
  );
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */

export default function DashboardAnalytics({ trips }) {
  const [allExpenses, setAllExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Fetch expenses for all trips once
  useEffect(() => {
    if (!trips || trips.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpensesLoading(false);
      return;
    }

    const fetchAll = async () => {
      setExpensesLoading(true);
      try {
        const results = await Promise.all(
          trips.map((t) => API.get(`/expenses/${t._id}`).then((r) => r.data).catch(() => []))
        );
        setAllExpenses(results.flat());
      } catch {
        setAllExpenses([]);
      }
      setExpensesLoading(false);
    };

    fetchAll();
  }, [trips]);

  /* ── Computed stats ── */
  const totalBudget = useMemo(() => trips.reduce((s, t) => s + (t.budget || 0), 0), [trips]);
  const totalSpent = useMemo(() => trips.reduce((s, t) => s + (t.totalExpense || 0), 0), [trips]);
  const remainingBudget = Math.max(totalBudget - totalSpent, 0);
  const budgetUsed = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

  /* ── Pie data: expense by category ── */
  const pieData = useMemo(() => {
    const catMap = {};
    allExpenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const total = Object.values(catMap).reduce((s, v) => s + v, 0);
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
        color: CATEGORY_COLORS[name] || '#6B7280',
      }));
  }, [allExpenses]);

  /* ── Bar data: budget vs actual per trip ── */
  const barData = useMemo(() => {
    return trips
      .slice(0, 8) // limit to 8 for readability
      .map((t) => ({
        name: t.name.length > 14 ? t.name.slice(0, 12) + '…' : t.name,
        budget: t.budget || 0,
        spent: t.totalExpense || 0,
      }));
  }, [trips]);

  /* ── Budget health ── */
  const budgetHealth = budgetUsed >= 100 ? 'danger' : budgetUsed >= 75 ? 'warning' : 'success';
  const budgetHealthLabel = budgetUsed >= 100 ? 'Over Budget' : budgetUsed >= 75 ? 'Caution' : 'Healthy';

  return (
    <section className="space-y-6">

      {/* ═══ Summary Stat Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Total Trips */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-125 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
              <Plane size={20} strokeWidth={2} />
            </div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Total Trips
            </p>
            <p className="text-3xl font-black text-navy mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {trips.length}
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/5 rounded-full group-hover:scale-125 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-3">
              <DollarSign size={20} strokeWidth={2} />
            </div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Total Expenses
            </p>
            <p className="text-3xl font-black text-navy mt-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{totalSpent >= 100000 ? (totalSpent / 100000).toFixed(1) + 'L' : totalSpent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className={`rounded-2xl p-6 border shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow ${
          budgetHealth === 'danger' ? 'bg-danger/5 border-danger/20' : budgetHealth === 'warning' ? 'bg-warning-light border-warning/20' : 'bg-success-light border-success/20'
        }`}>
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/40 rounded-full group-hover:scale-125 transition-transform duration-500" />
          <div className="relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              budgetHealth === 'danger' ? 'bg-danger/10 text-danger' : budgetHealth === 'warning' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
            }`}>
              <Wallet size={20} strokeWidth={2} />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                Remaining Budget
              </p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                budgetHealth === 'danger' ? 'bg-danger/10 text-danger' : budgetHealth === 'warning' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
              }`}>{budgetHealthLabel}</span>
            </div>
            <p className={`text-3xl font-black mt-1 ${
              budgetHealth === 'danger' ? 'text-danger' : budgetHealth === 'warning' ? 'text-warning' : 'text-success'
            }`} style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{remainingBudget >= 100000 ? (remainingBudget / 100000).toFixed(1) + 'L' : remainingBudget.toLocaleString()}
            </p>
            {/* mini progress */}
            <div className="mt-3 w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(Number(budgetUsed), 100)}%`,
                  background: budgetHealth === 'danger' ? 'var(--color-danger)' : budgetHealth === 'warning' ? 'var(--color-warning)' : 'var(--color-success)',
                }}
              />
            </div>
            <p className="text-[9px] text-text-muted mt-1 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              {budgetUsed}% of ₹{totalBudget.toLocaleString()} used
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ── Expense Breakdown Pie ── */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
              <PieChartIcon size={16} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Expense Breakdown
              </h4>
              <p className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>By category across all trips</p>
            </div>
          </div>

          {expensesLoading ? (
            <ChartSkeleton height={240} />
          ) : pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-4">
                <PieChartIcon size={28} className="text-text-muted opacity-40" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">No expense data yet</p>
              <p className="text-xs text-text-muted max-w-[200px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Start adding expenses to your trips to see the breakdown here.
              </p>
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
                {pieData.map((seg) => (
                  <div key={seg.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-[10px] text-text-secondary font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {seg.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Budget vs Actual Bar ── */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <BarChart2 size={16} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Budget vs Actual
              </h4>
              <p className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Per-trip comparison</p>
            </div>
          </div>

          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-4">
                <BarChart2 size={28} className="text-text-muted opacity-40" />
              </div>
              <p className="text-sm font-bold text-navy mb-1">No trips to compare</p>
              <p className="text-xs text-text-muted max-w-[200px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Create your first trip to see budget analytics.
              </p>
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={barData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      interval={0}
                      angle={barData.length > 4 ? -25 : 0}
                      textAnchor={barData.length > 4 ? 'end' : 'middle'}
                      height={barData.length > 4 ? 50 : 30}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <RechartsTooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(37, 99, 235, 0.04)' }} />
                    <Bar dataKey="budget" name="Budget" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={barData.length > 5 ? 16 : 24} animationDuration={800} />
                    <Bar dataKey="spent" name="Spent" fill="#FF6B35" radius={[4, 4, 0, 0]} barSize={barData.length > 5 ? 16 : 24} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: '#2563EB' }} />
                  <span className="text-[10px] text-text-secondary font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: '#FF6B35' }} />
                  <span className="text-[10px] text-text-secondary font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Actual Spent</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
