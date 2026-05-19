import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, Wallet } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell({ dark = false }) {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertTriangle size={16} className="text-danger" />;
      case 'warning': return <AlertTriangle size={16} className="text-warning" />;
      case 'success': return <CheckCircle2 size={16} className="text-success" />;
      case 'info': return <Info size={16} className="text-primary" />;
      default: return <Bell size={16} className="text-text-secondary" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className={`relative p-2 rounded-xl transition-colors border-0 bg-transparent cursor-pointer ${dark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-text-secondary hover:text-navy hover:bg-border-light'}`}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-[300px] sm:w-80 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-[999] origin-top-right animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg/50 backdrop-blur-sm">
            <h3 className="font-bold text-navy" style={{ fontFamily: "'Poppins', sans-serif" }}>Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-xl uppercase tracking-wider">
                {unreadCount} New
              </span>
            )}
          </div>
          
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <Bell size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>No notifications yet</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-bg/50 transition-colors flex gap-3 items-start">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                      ${notif.type === 'danger' ? 'bg-danger/10' : 
                        notif.type === 'warning' ? 'bg-warning/10' : 
                        notif.type === 'success' ? 'bg-success/10' : 'bg-primary/10'}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-text-secondary leading-snug line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-text-muted mt-1.5 font-medium">
                        {getTimeAgo(notif.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
