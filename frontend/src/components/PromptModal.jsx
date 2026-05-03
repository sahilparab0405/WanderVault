import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function PromptModal({ title, message, defaultValue = '', onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-6">
      <div className="bg-white rounded-3xl max-w-md w-full p-10 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-primary/10 text-primary mb-6 mx-auto">
          <HelpCircle size={32} />
        </div>
        <h3 className="text-2xl font-black text-navy text-center mb-4">{title}</h3>
        <p className="text-text-secondary text-center mb-6 leading-relaxed">{message}</p>
        <input 
          type="text" 
          value={value} 
          onChange={e => setValue(e.target.value)} 
          className="w-full border border-border rounded-xl px-6 py-4 mb-8 text-sm focus:outline-none focus:border-accent bg-bg" 
          autoFocus 
          onKeyDown={e => e.key === 'Enter' && onConfirm(value)} 
        />
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCancel} className="py-4 rounded-xl font-bold bg-bg text-navy hover:bg-border transition-all cursor-pointer border-0">
            Cancel
          </button>
          <button onClick={() => onConfirm(value)} className="py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-all cursor-pointer border-0 shadow-lg shadow-primary/20">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
