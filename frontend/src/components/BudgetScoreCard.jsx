import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export default function BudgetScoreCard({ budget, days = 1, destination = '' }) {
  const analysis = useMemo(() => {
    if (!budget || budget <= 0) return null;
    
    const dailyBudget = Math.floor(budget / Math.max(1, days));
    const destLower = destination.toLowerCase();
    
    let minDay = 2000;
    let comfDay = 4000;
    
    // Classify destination tier
    if (/mumbai|delhi|london|new york|tokyo|dubai|paris|singapore|sydney|zurich|san francisco/i.test(destLower)) {
      minDay = 3000;
      comfDay = 6000;
    } else if (/goa|jaipur|bali|phuket|maldives|cancun|ibiza|manali|kerala|agra/i.test(destLower)) {
      minDay = 2500;
      comfDay = 5000;
    }

    let score = 'RISKY';
    let color = 'text-danger bg-danger/10 border-danger/30';
    let icon = <AlertCircle size={24} />;
    let message = `Suggestion: Add ₹${((minDay - dailyBudget) * days).toLocaleString()} more for safety.`;

    if (dailyBudget >= comfDay * 1.5) {
      score = 'EXCELLENT';
      color = 'text-success bg-success/10 border-success/30';
      icon = <CheckCircle2 size={24} />;
      message = "You have plenty of room for luxury and shopping!";
    } else if (dailyBudget >= comfDay * 0.8) {
      score = 'GOOD';
      color = 'text-primary bg-primary/10 border-primary/30';
      icon = <TrendingUp size={24} />;
      message = "Covers: Great Hotels + Food + Activities.";
    } else if (dailyBudget >= minDay) {
      score = 'TIGHT';
      color = 'text-accent bg-accent/10 border-accent/30';
      icon = <Info size={24} />;
      message = `You can do it, but stick to public transport and hostels.`;
    }

    return {
      dailyBudget,
      score,
      color,
      icon,
      message,
      breakdown: [
        { label: 'Stay', val: budget * 0.40 },
        { label: 'Food', val: budget * 0.25 },
        { label: 'Fun', val: budget * 0.20 },
        { label: 'Transit', val: budget * 0.10 },
        { label: 'Buffer', val: budget * 0.05 },
      ]
    };
  }, [budget, days, destination]);

  if (!analysis) return null;

  return (
    <div className="mt-8 bg-white rounded-3xl p-6 border border-border shadow-lg">
      <h4 className="text-sm font-black text-navy uppercase tracking-widest mb-6 opacity-70">AI Budget Analysis</h4>
      
      <div className={`p-4 rounded-2xl border flex items-start gap-4 mb-6 ${analysis.color}`}>
        <div className="shrink-0 mt-1">{analysis.icon}</div>
        <div>
          <p className="font-bold text-[10px] uppercase tracking-widest opacity-80 mb-1">Your Budget Score</p>
          <h3 className="text-2xl font-black mb-1">{analysis.score}</h3>
          <p className="text-sm font-semibold opacity-90">₹{analysis.dailyBudget.toLocaleString()}/day for {destination.split(',')[0]} ({days} days)</p>
          <p className="text-xs mt-2 opacity-80">{analysis.message}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Suggested Allocation</p>
        {analysis.breakdown.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-secondary w-16">{item.label}</span>
            <div className="flex-1 max-w-[150px] mx-4 h-2 bg-border-light rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${['bg-navy', 'bg-primary', 'bg-accent', 'bg-success', 'bg-danger'][idx]}`} 
                style={{ width: `${(item.val / budget) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-navy tabular-nums text-right w-20">₹{item.val.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
