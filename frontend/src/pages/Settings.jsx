import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Globe, Bell, Shield, Save, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [preferences, setPreferences] = useState({
    currency: '₹ INR',
    notifications: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-bg p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Account Settings</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your profile and travel preferences.</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded- border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-6 py-6 border-b border-border bg-bg/30 flex items-center gap-2">
            <User size={18} className="text-primary" />
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Profile Information</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 px-1">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full border border-border rounded-xl px-6 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 px-1">Email Address</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled
                  className="w-full border border-border rounded-xl px-6 py-2.5 text-sm bg-bg/50 text-text-muted cursor-not-allowed" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded- border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-6 py-6 border-b border-border bg-bg/30 flex items-center gap-2">
            <Lock size={18} className="text-accent" />
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Security</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 px-1">Current Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full border border-border rounded-xl px-6 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 px-1">New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full border border-border rounded-xl px-6 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1 px-1">Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full border border-border rounded-xl px-6 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded- border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-6 py-6 border-b border-border bg-bg/30 flex items-center gap-2">
            <Globe size={18} className="text-success" />
            <h3 className="font-bold text-navy text-sm uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Preferences</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Base Currency</h4>
                <p className="text-xs text-text-secondary mt-0.5">Used for expense tracking and budgeting.</p>
              </div>
              <select 
                value={preferences.currency} 
                onChange={e => setPreferences({...preferences, currency: e.target.value})}
                className="w-full md:w-48 border border-border rounded-xl px-6 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="₹ INR">₹ INR (Indian Rupee)</option>
                <option value="$ USD">$ USD (US Dollar)</option>
                <option value="€ EUR">€ EUR (Euro)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between border-t border-border pt-6">
              <div>
                <h4 className="text-sm font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Email Notifications</h4>
                <p className="text-xs text-text-secondary mt-0.5">Receive budget alerts and trip reminders.</p>
              </div>
              <button 
                onClick={() => setPreferences({...preferences, notifications: !preferences.notifications})}
                className={`w-12 h-6 rounded- transition-colors relative ${preferences.notifications ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded- transition-all ${preferences.notifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Save Area */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          {saved && (
            <span className="text-success text-sm font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
              <CheckCircle size={16} /> Changes saved successfully
            </span>
          )}
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-8 py-6 rounded- font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border-0 cursor-pointer"
            style={{ boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
