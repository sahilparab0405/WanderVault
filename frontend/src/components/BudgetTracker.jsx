/**
 * BudgetTracker — Premium Budget Analytics Component
 *
 * Features:
 *   1. Recharts Pie Chart — spending by category with custom tooltip
 *   2. Recharts Bar Chart — daily spending timeline with daily budget line
 *   3. Lottery Voucher Budget Card — dotted border, color-coded status
 *   4. Budget Threshold Milestones — visual progress at 50%, 75%, 90%, 100%
 *   5. Per-day budget analysis — remaining budget ÷ remaining days
 *   6. PDF Export — professional budget report via jsPDF
 *   7. CSV Export — download expenses as a spreadsheet
 */

import { useMemo, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
  Legend,
} from 'recharts';

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

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚗', Hotel: '🏨',
  Activities: '🎯', Shopping: '🛍️', Other: '💸'
};

const THRESHOLDS = [
  { percent: 50, label: '50%', color: '#3B82F6', bg: 'bg-primary-50', text: 'text-primary', message: 'Halfway through your budget' },
  { percent: 75, label: '75%', color: '#F59E0B', bg: 'bg-warning-light', text: 'text-warning', message: 'Consider slowing down spending' },
  { percent: 90, label: '90%', color: '#FF6B35', bg: 'bg-accent-50', text: 'text-accent', message: 'Almost at your limit!' },
  { percent: 100, label: '100%', color: '#EF4444', bg: 'bg-danger-light', text: 'text-danger', message: 'Budget exceeded!' },
];

/* ═══════════════════════════════════════
   Custom Pie Tooltip
   ═══════════════════════════════════════ */

function PieTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: data } = payload[0];
  return (
    <div
      className="bg-navy text-white px-3 py-2 rounded-lg"
      style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <p className="font-semibold mb-0.5">{CATEGORY_ICONS[name]} {name}</p>
      <p>₹{value.toLocaleString()} ({data.percentage.toFixed(1)}%)</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   Custom Bar Tooltip
   ═══════════════════════════════════════ */

function BarTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-navy text-white px-3 py-2 rounded-lg"
      style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <p className="font-semibold mb-0.5">{label}</p>
      <p>₹{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   Custom Pie Label
   ═══════════════════════════════════════ */

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.08) return null; // Don't render label for tiny slices
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x} y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
      fontFamily="Inter, sans-serif"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

/* ═══════════════════════════════════════
   Lottery Voucher Budget Card
   ═══════════════════════════════════════ */

function BudgetVoucher({ trip, totalSpent, remaining, budgetPercent }) {
  const statusColor = budgetPercent >= 100 ? 'danger' : budgetPercent >= 75 ? 'warning' : 'success';
  const statusLabel = budgetPercent >= 100 ? 'OVER BUDGET' : budgetPercent >= 75 ? 'CAUTION' : 'ON TRACK';
  const statusBg = budgetPercent >= 100
    ? 'bg-danger-light border-danger/30'
    : budgetPercent >= 75
      ? 'bg-warning-light border-warning/30'
      : 'bg-success-light border-success/30';

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        border: '2px dashed var(--color-border)',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
      }}
    >
      {/* Decorative holes on left side */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-3" style={{ marginLeft: '-8px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-4 h-4 rounded-full bg-bg border border-border" />
        ))}
      </div>

      {/* Decorative holes on right side */}
      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-3" style={{ marginRight: '-8px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-4 h-4 rounded-full bg-bg border border-border" />
        ))}
      </div>

      <div className="px-8 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold"
              style={{ fontFamily: "'Inter', sans-serif" }}>
              WanderVault Budget Pass
            </p>
            <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {trip.name}
            </h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusBg}`}
            style={{ fontFamily: "'Inter', sans-serif", color: `var(--color-${statusColor})` }}>
            {statusLabel}
          </div>
        </div>

        {/* Dotted separator */}
        <div className="border-t-2 border-dashed border-border my-3" />

        {/* Budget Info */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}>Total Budget</p>
            <p className="text-xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{trip.budget?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}>Spent</p>
            <p className="text-xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}>Remaining</p>
            <p className={`text-xl font-bold`}
              style={{ fontFamily: "'Poppins', sans-serif", color: `var(--color-${statusColor})` }}>
              ₹{remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Dotted separator */}
        <div className="border-t-2 border-dashed border-border my-3" />

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-text-muted mb-1.5 font-medium"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            <span>{budgetPercent.toFixed(1)}% used</span>
            <span>{Math.max(100 - budgetPercent, 0).toFixed(1)}% left</span>
          </div>
          <div className="w-full bg-border-light rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(budgetPercent, 100)}%`,
                background: budgetPercent >= 100
                  ? 'var(--color-danger)'
                  : budgetPercent >= 75
                    ? 'var(--color-warning)'
                    : 'var(--color-success)',
              }}
            />
          </div>
        </div>

        {/* Serial number at bottom */}
        <div className="mt-3 flex justify-between items-center">
          <p className="text-[9px] text-text-muted font-medium tracking-wider"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            📍 {trip.destination}
          </p>
          <p className="text-[9px] text-text-muted font-medium tracking-wider"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            #{trip._id?.slice(-6).toUpperCase() || 'XXXXXX'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Threshold Milestones
   ═══════════════════════════════════════ */

function ThresholdMilestones({ budgetPercent }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Budget Milestones
      </h4>
      <div className="space-y-2">
        {THRESHOLDS.map((t) => {
          const reached = budgetPercent >= t.percent;
          return (
            <div
              key={t.percent}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                reached ? t.bg : 'bg-bg'
              }`}
            >
              {/* Milestone indicator */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  reached ? 'text-white' : 'text-text-muted border-2 border-border-light bg-white'
                }`}
                style={reached ? { background: t.color } : {}}
              >
                {reached ? '✓' : t.label.replace('%', '')}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${reached ? t.text : 'text-text-muted'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t.label} — {t.message}
                </p>
              </div>

              {/* Status */}
              <span className={`text-[10px] font-semibold shrink-0 ${reached ? t.text : 'text-text-muted'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}>
                {reached ? 'Reached' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CSV Export
   ═══════════════════════════════════════ */

function exportToCSV(expenses, tripName) {
  const headers = ['Title', 'Amount (₹)', 'Category', 'Date'];
  const rows = expenses.map((exp) => [
    `"${exp.title}"`,
    exp.amount,
    exp.category,
    new Date(exp.date || exp.createdAt).toLocaleDateString('en-IN'),
  ]);

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  rows.push(['', '', '', '']);
  rows.push(['"TOTAL"', total, '', '']);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${tripName.replace(/[^a-zA-Z0-9]/g, '_')}_expenses.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════
   PDF Export
   ═══════════════════════════════════════ */

async function exportToPDF(trip, expenses, categoryTotals, totalSpent, remaining, budgetPercent) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── Header ───
  doc.setFillColor(26, 43, 74); // navy
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('WanderVault', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Budget Report', 14, 26);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 33);

  // ─── Trip Info ───
  let y = 52;
  doc.setTextColor(26, 43, 74);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(trip.name, 14, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`📍 ${trip.destination}`, 14, y);

  y += 6;
  const startStr = new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const endStr = new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.text(`📅 ${startStr} → ${endStr}`, 14, y);

  // ─── Budget Summary Box ───
  y += 12;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, y, pageWidth - 28, 32, 3, 3, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(14, y, pageWidth - 28, 32, 3, 3, 'S');

  const thirdWidth = (pageWidth - 28) / 3;

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.text('TOTAL BUDGET', 14 + thirdWidth * 0 + thirdWidth / 2, y + 10, { align: 'center' });
  doc.text('SPENT', 14 + thirdWidth * 1 + thirdWidth / 2, y + 10, { align: 'center' });
  doc.text('REMAINING', 14 + thirdWidth * 2 + thirdWidth / 2, y + 10, { align: 'center' });

  doc.setTextColor(26, 43, 74);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${trip.budget.toLocaleString()}`, 14 + thirdWidth * 0 + thirdWidth / 2, y + 22, { align: 'center' });
  doc.text(`₹${totalSpent.toLocaleString()}`, 14 + thirdWidth * 1 + thirdWidth / 2, y + 22, { align: 'center' });

  // Remaining in color
  if (budgetPercent >= 100) doc.setTextColor(239, 68, 68); // danger
  else if (budgetPercent >= 75) doc.setTextColor(245, 158, 11); // warning
  else doc.setTextColor(34, 197, 94); // success
  doc.text(`₹${remaining.toLocaleString()}`, 14 + thirdWidth * 2 + thirdWidth / 2, y + 22, { align: 'center' });

  // ─── Budget usage bar ───
  y += 40;
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Budget Usage: ${budgetPercent.toFixed(1)}%`, 14, y);

  y += 4;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, y, pageWidth - 28, 6, 3, 3, 'F');

  const barWidth = Math.min(budgetPercent, 100) / 100 * (pageWidth - 28);
  if (budgetPercent >= 100) doc.setFillColor(239, 68, 68);
  else if (budgetPercent >= 75) doc.setFillColor(245, 158, 11);
  else doc.setFillColor(34, 197, 94);
  if (barWidth > 0) doc.roundedRect(14, y, barWidth, 6, 3, 3, 'F');

  // ─── Category Breakdown ───
  y += 16;
  doc.setTextColor(26, 43, 74);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', 14, y);

  y += 4;
  const catRows = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => [
      cat,
      `₹${total.toLocaleString()}`,
      `${totalSpent > 0 ? ((total / totalSpent) * 100).toFixed(1) : 0}%`,
    ]);

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount', '% of Total']],
    body: catRows,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 43, 74],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [26, 43, 74],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    margin: { left: 14, right: 14 },
    tableWidth: pageWidth - 28,
  });

  // ─── Expenses Table ───
  y = doc.lastAutoTable.finalY + 12;
  doc.setTextColor(26, 43, 74);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('All Expenses', 14, y);

  y += 4;
  const expRows = expenses.map((exp) => [
    exp.title,
    exp.category,
    `₹${exp.amount.toLocaleString()}`,
    new Date(exp.date || exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  ]);

  // Add total row
  expRows.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    '',
    { content: `₹${totalSpent.toLocaleString()}`, styles: { fontStyle: 'bold' } },
    '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Title', 'Category', 'Amount', 'Date']],
    body: expRows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [26, 43, 74],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    margin: { left: 14, right: 14 },
    tableWidth: pageWidth - 28,
  });

  // ─── Footer ───
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `WanderVault Budget Report — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${trip.name.replace(/[^a-zA-Z0-9]/g, '_')}_Budget_Report.pdf`);
}

/* ═══════════════════════════════════════
   Main BudgetTracker Component
   ═══════════════════════════════════════ */

export default function BudgetTracker({ trip, expenses }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeView, setActiveView] = useState('charts'); // 'charts' | 'milestones'

  const categoryTotals = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
  }, [expenses]);

  const totalSpent = trip.totalExpense || 0;
  const budgetPercent = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;
  const remaining = Math.max(trip.budget - totalSpent, 0);

  // ─── Date calculations ───
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endDate = new Date(trip.endDate);
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(trip.startDate);
  startDate.setHours(0, 0, 0, 0);

  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const remainingDays = Math.max(Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) + 1, 0);
  const dailyBudgetRemaining = remainingDays > 0 ? remaining / remainingDays : 0;
  const averageDailySpend = totalDays > 0 ? totalSpent / totalDays : 0;
  const dailyBudget = trip.budget / Math.max(totalDays, 1);

  // ─── Projection ───
  const projectedTotal = averageDailySpend * totalDays;
  const projectedOverBudget = projectedTotal > trip.budget;

  // ─── Pie chart data ───
  const pieData = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        color: CATEGORY_COLORS[category] || '#6B7280',
      }));
  }, [categoryTotals, totalSpent]);

  // ─── Bar chart data ───
  const barData = useMemo(() => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = {};

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      days[key] = {
        date: key,
        label: new Date(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        total: 0,
      };
    }

    expenses.forEach((exp) => {
      const expDate = (exp.date || exp.createdAt || '').split('T')[0];
      if (days[expDate]) {
        days[expDate].total += exp.amount;
      }
    });

    return Object.values(days);
  }, [expenses, trip.startDate, trip.endDate]);

  // ─── PDF handler ───
  const handlePdfExport = useCallback(async () => {
    setPdfLoading(true);
    try {
      await exportToPDF(trip, expenses, categoryTotals, totalSpent, remaining, budgetPercent);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setPdfLoading(false);
  }, [trip, expenses, categoryTotals, totalSpent, remaining, budgetPercent]);

  // ─── Custom bar color ───
  const getBarColor = (entry) => {
    return entry.total > dailyBudget ? '#EF4444' : '#2563EB';
  };

  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border"
      style={{ boxShadow: 'var(--shadow-card)' }}
      id="budget-tracker-section"
    >
      {/* ═══ Header ═══ */}
      <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-bold text-navy text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Budget Analytics
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={() => exportToCSV(expenses, trip.name)}
            disabled={expenses.length === 0}
            id="budget-export-csv"
            className="inline-flex items-center gap-1 text-text-secondary text-xs font-semibold cursor-pointer
                       bg-bg hover:bg-border-light px-3 py-1.5 rounded-lg border border-border
                       transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>

          {/* PDF Export */}
          <button
            onClick={handlePdfExport}
            disabled={expenses.length === 0 || pdfLoading}
            id="budget-export-pdf"
            className="inline-flex items-center gap-1 text-white text-xs font-semibold cursor-pointer
                       bg-accent hover:bg-accent-dark px-3 py-1.5 rounded-lg border-0
                       transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {pdfLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">

        {/* ═══ Lottery Voucher Budget Card ═══ */}
        <BudgetVoucher
          trip={trip}
          totalSpent={totalSpent}
          remaining={remaining}
          budgetPercent={Math.min(budgetPercent, 100)}
        />

        {/* ═══ Stats Row ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-bg rounded-xl p-3 text-center border border-border-light">
            <p className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{remaining.toLocaleString()}
            </p>
            <p className="text-[10px] text-text-muted font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              Remaining
            </p>
          </div>
          <div className="bg-bg rounded-xl p-3 text-center border border-border-light">
            <p className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{Math.round(dailyBudgetRemaining).toLocaleString()}
            </p>
            <p className="text-[10px] text-text-muted font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              Per day left
            </p>
          </div>
          <div className="bg-bg rounded-xl p-3 text-center border border-border-light">
            <p className="text-lg font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{Math.round(averageDailySpend).toLocaleString()}
            </p>
            <p className="text-[10px] text-text-muted font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              Avg/day
            </p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${
            projectedOverBudget ? 'bg-danger-light border-danger/20' : 'bg-success-light border-success/20'
          }`}>
            <p className={`text-lg font-bold ${projectedOverBudget ? 'text-danger' : 'text-success'}`}
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              ₹{Math.round(projectedTotal).toLocaleString()}
            </p>
            <p className="text-[10px] text-text-muted font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              Projected total
            </p>
          </div>
        </div>

        {/* ═══ View Toggle ═══ */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('charts')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150 ${
              activeView === 'charts'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-secondary border-border hover:bg-bg'
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            📊 Charts
          </button>
          <button
            onClick={() => setActiveView('milestones')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150 ${
              activeView === 'milestones'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-secondary border-border hover:bg-bg'
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            🎯 Milestones
          </button>
        </div>

        {/* ═══ Charts View ═══ */}
        {activeView === 'charts' && (
          <>
            {/* ─── Pie Chart + Category Breakdown ─── */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Pie Chart */}
              <div>
                <h4 className="text-xs font-bold text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Spending Breakdown
                </h4>
                {pieData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <span className="text-4xl mb-2">💸</span>
                    <p className="text-text-muted text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                      No expenses to analyze yet
                    </p>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={renderCustomLabel}
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                          stroke="none"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<PieTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Legend */}
                {pieData.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                    {pieData.map((seg) => (
                      <div key={seg.name} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                        <span className="text-[10px] text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {seg.name} ({seg.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category List */}
              <div>
                <h4 className="text-xs font-bold text-navy mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  By Category
                </h4>
                {Object.keys(categoryTotals).length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-text-muted text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                      No expenses to analyze yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(categoryTotals)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, total]) => {
                        const catPercent = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
                        return (
                          <div key={cat} className="flex items-center gap-2.5">
                            <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="text-xs font-medium text-navy truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  {cat}
                                </span>
                                <span className="text-xs font-bold text-navy shrink-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                  ₹{total.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full bg-border-light rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${catPercent}%`,
                                    background: CATEGORY_COLORS[cat] || '#6B7280',
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Daily Spending Bar Chart ─── */}
            {barData.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Daily Spending
                  </h4>
                  <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Daily budget: ₹{Math.round(dailyBudget).toLocaleString()}
                  </span>
                </div>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={barData}
                      margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                      barCategoryGap="15%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border-light)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        interval={barData.length > 10 ? 1 : 0}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <RechartsTooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
                      <ReferenceLine
                        y={dailyBudget}
                        stroke="var(--color-warning)"
                        strokeDasharray="6 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'Daily limit',
                          position: 'insideTopRight',
                          fill: 'var(--color-warning)',
                          fontSize: 9,
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                        }}
                      />
                      <Bar
                        dataKey="total"
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {barData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.total > dailyBudget ? '#EF4444' : '#2563EB'}
                            fillOpacity={entry.total === 0 ? 0.15 : 0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend for bars */}
                <div className="flex items-center justify-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#2563EB' }} />
                    <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Within budget</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#EF4444' }} />
                    <span className="text-[10px] text-text-muted" style={{ fontFamily: "'Inter', sans-serif" }}>Over daily limit</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ Milestones View ═══ */}
        {activeView === 'milestones' && (
          <ThresholdMilestones budgetPercent={(totalSpent / trip.budget) * 100} />
        )}
      </div>
    </div>
  );
}
