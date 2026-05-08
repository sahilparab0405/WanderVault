import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axios';
import BudgetTracker from '../components/BudgetTracker';
import { 
  BarChart2, PieChart, Wallet, AlertTriangle, 
  CheckCircle, ArrowRight, Filter, Printer, Download,
  Target, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Budget() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    try {
      const { data } = await API.get('/trips');
      setTrips(data);
    } catch {
      // Error fetching trips
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const { totalSpent, avgEfficiency, overBudgetTrips } = useMemo(() => {
    const budget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
    const spent = trips.reduce((sum, t) => sum + (t.totalExpense || 0), 0);
    return {
      totalBudget: budget,
      totalSpent: spent,
      avgEfficiency: budget > 0 ? (spent / budget) * 100 : 0,
      overBudgetTrips: trips.filter(t => t.budgetExceeded).length
    };
  }, [trips]);

  if (loading) return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-border/40 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="h-[400px] bg-white rounded-3xl animate-pulse border border-border" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-border px-8 py-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-navy leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Budgeting
          </h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">
            Global Financial Health
          </p>
        </div>
        <div className="flex gap-2">
           <button className="p-2.5 bg-bg border border-border rounded- text-text-muted hover:text-navy transition-colors border-0 cursor-pointer">
              <Printer size={18} />
           </button>
           <button className="p-2.5 bg-bg border border-border rounded- text-text-muted hover:text-navy transition-colors border-0 cursor-pointer">
              <Download size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 space-y-10 animate-in fade-in duration-700">
        
        {/* Global Stats Matrix */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-navy rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-navy/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded- -mr-16 -mt-16" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 text-white rounded- flex items-center justify-center shadow-inner">
                <Wallet size={32} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Global Spend</p>
                <p className="text-3xl font-black leading-tight">₹{totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-border shadow-sm flex items-center gap-5 group hover:border-danger/30 transition-colors">
            <div className={`w-16 h-16 ${overBudgetTrips > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'} rounded- flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
              {overBudgetTrips > 0 ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Budget Health</p>
              <p className="text-2xl font-black text-navy leading-tight">{overBudgetTrips} Over Limit</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-border shadow-sm flex items-center gap-5 group hover:border-primary/30 transition-colors">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded- flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Target size={32} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Efficiency Ratio</p>
              <p className="text-2xl font-black text-navy leading-tight">{avgEfficiency.toFixed(1)}%</p>
            </div>
          </div>
        </section>

        {/* Global Warnings / Insights */}
        {overBudgetTrips > 0 && (
           <div className="bg-amber-50 border border-amber-200 rounded- p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500 text-white rounded- flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                 <AlertTriangle size={20} />
              </div>
              <div>
                 <h4 className="font-black text-amber-900 text-sm">Action Required</h4>
                 <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">We've detected {overBudgetTrips} trips that have exceeded their planned budgets. Review your expenses in the breakdown below to optimize future travel spending.</p>
              </div>
           </div>
        )}

        {/* Trip Breakdown Section */}
        <section className="space-y-12">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <PieChart size={24} className="text-primary" />
                 <h2 className="text-xl font-black text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Trip Breakdowns</h2>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-white px-6 py-1 rounded- border border-border">Sort by Spend</span>
                 <Filter size={14} className="text-text-muted" />
              </div>
           </div>

           {trips.length > 0 ? (
             <div className="grid gap-12">
               {trips.slice(0, 5).map(trip => (
                 <div key={trip._id} className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded- border border-border shadow-sm flex items-center justify-center font-black text-navy">
                          {trip.destination.charAt(0)}
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>{trip.name}</h3>
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{trip.destination}</p>
                       </div>
                     </div>
                     <Link to={`/trip/${trip._id}`} className="inline-flex items-center gap-2 px-6 py-2.5 bg-bg border border-border rounded- text-[11px] font-black text-navy no-underline hover:bg-white transition-all">
                        MANAGE EXPENSES <ArrowRight size={14} />
                     </Link>
                   </div>
                   
                   <div className="bg-white rounded-3xl p-10 lg:p-14 border border-border shadow-xl hover:shadow-2xl hover:shadow-navy/5 transition-all">
                      <AnalyticWrapper tripId={trip._id} trip={trip} />
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-border shadow-sm">
               <div className="w-24 h-24 bg-bg rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <BarChart2 size={48} className="text-text-muted opacity-30" />
               </div>
               <h3 className="text-3xl font-black text-navy mb-4">No Financial Records</h3>
               <p className="text-text-secondary mb-10 max-w-sm mx-auto font-medium leading-relaxed">Start planning your first adventure to visualize detailed budget analytics and spending patterns here.</p>
               <Link to="/create-trip" className="inline-flex items-center gap-3 bg-accent text-white px-10 py-6 rounded- font-black text-sm no-underline shadow-2xl shadow-accent/40 hover:-translate-y-1 transition-all">
                 INITIALIZE TRIP <ArrowRight size={18} />
               </Link>
             </div>
           )}
        </section>

        {/* Global Insight Footer */}
        <section className="bg-accent/10 rounded-3xl p-8 border border-accent/20 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-accent text-white rounded- flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
                 <Info size={28} />
              </div>
              <div className="text-center md:text-left">
                 <h5 className="font-black text-navy text-lg leading-tight">Budget Tip</h5>
                 <p className="text-sm text-text-secondary mt-1 max-w-md font-medium">Tracking daily expenses manually increases financial awareness by 40%. Stay on top of your trips for a worry-free experience.</p>
              </div>
           </div>
           <button className="bg-navy text-white px-8 py-6 rounded- font-black text-xs border-0 cursor-pointer shadow-xl shadow-navy/20 whitespace-nowrap">
              EXPORT REPORT (.PDF)
           </button>
        </section>
      </main>

      <footer className="py-12 px-8 text-center text-text-muted/40 text-[10px] font-black uppercase tracking-[0.3em]">
          WanderVault Analytics Engine v2.0
      </footer>
    </div>
  );
}

// Wrapper to fetch specific expenses for each trip in the list
function AnalyticWrapper({ tripId, trip }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const { data } = await API.get(`/expenses/${tripId}`);
        setExpenses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [tripId]);

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center gap-4">
       <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded- animate-spin" />
       <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Compiling Data...</p>
    </div>
  );

  return <BudgetTracker trip={trip} expenses={expenses} />;
}
