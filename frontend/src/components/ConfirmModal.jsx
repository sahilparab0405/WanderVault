import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-6">
      <div className="bg-white rounded-3xl max-w-md w-full p-10 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-danger/10 text-danger mb-6 mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-2xl font-black text-navy text-center mb-4">{title}</h3>
        <p className="text-text-secondary text-center mb-8 leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCancel} className="py-4 rounded-xl font-bold bg-bg text-navy hover:bg-border transition-all cursor-pointer border-0">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="py-4 rounded-xl font-bold text-white bg-danger hover:bg-red-600 transition-all cursor-pointer border-0 shadow-lg shadow-danger/20">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
