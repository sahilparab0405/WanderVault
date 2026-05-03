import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export default function BudgetScoreCard({ budget, days = 1, destination = '' }) {
  const analysis = useMemo(() => {
    if (!budget || budget <= 0) return null;
    
    const dailyBudget = Math.floor(budget / Math.max(1, days));
    const destLower = destination.toLowerCase();
    
    let minDay = 1500;
    let comfDay = 4000;
    
    // Classify destination tier
    if (/mumbai|delhi|london|paris|dubai|singapore|new york/i.test(destLower)) {
      // Tier 1
      minDay = 5000;
      comfDay = 10000;
    } else if (/goa|jaipur|bangkok|bali|manali|shimla|kerala/i.test(destLower)) {
      // Tier 2
      minDay = 2500;
      comfDay = 6000;
    }

    let score = 'RISKY';
    let colorClass = 'border-l-danger text-danger bg-danger-light/30';
    let icon = <AlertCircle size={20} />;

    if (dailyBudget >= comfDay) {
      score = 'EXCELLENT';
      colorClass = 'border-l-success text-success bg-success-light/30';
      icon = <CheckCircle2 size={20} />;
    } else if (dailyBudget >= minDay * 1.5) {
      score = 'GOOD';
      colorClass = 'border-l-primary text-primary bg-primary-light/30';
      icon = <TrendingUp size={20} />;
    } else if (dailyBudget >= minDay) {
      score = 'TIGHT';
      colorClass = 'border-l-accent text-accent bg-accent-light/30';
      icon = <Info size={20} />;
    }

    return {
      dailyBudget,
      score,
      colorClass,
      icon,
      breakdown: [
        { label: 'Hotels', val: budget * 0.40 },
        { label: 'Food', val: budget * 0.25 },
        { label: 'Activities', val: budget * 0.20 },
        { label: 'Transport', val: budget * 0.10 },
        { label: 'Emergency', val: budget * 0.05 },
      ]
    };
  }, [budget, days, destination]);

  if (!analysis) return null;

  return (
    <div className="mt-6 bg-white rounded- p-6 border border-border shadow-sm flex flex-col gap-4">
      
      <div className={`p-6 rounded-xl-r-lg border-y border-r border-border border-l-4 flex items-center gap-4 ${analysis.colorClass}`}>
        <div className="shrink-0">{analysis.icon}</div>
        <div>
          <h3 className="text-sm font-bold tracking-wide uppercase">{analysis.score}</h3>
          <p className="text-xs mt-0.5 opacity-90 font-medium text-navy">₹{analysis.dailyBudget.toLocaleString()} per day</p>
        </div>
      </div>

      <div className="space-y-2.5 px-1">
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Suggested Breakdown</p>
        {analysis.breakdown.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">{item.label} ({(item.val / budget * 100).toFixed(0)}%)</span>
            <span className="font-bold text-navy">₹{item.val.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
