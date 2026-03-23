
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../core/types/types';

interface ToastProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const icons = {
        success: <CheckCircle size={18} className="text-green-400" />,
        error: <XCircle size={18} className="text-red-400" />,
        info: <Info size={18} className="text-blue-400" />
    };

    const bgColors = {
        success: 'bg-[#0f1f15] border-green-900/50',
        error: 'bg-[#1f0f0f] border-red-900/50',
        info: 'bg-[#0f151f] border-blue-900/50'
    };

    return (
        <div className={`pointer-events-auto flex items-center gap-3 p-3 rounded-lg border shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${bgColors[toast.type]}`}>
            {icons[toast.type]}
            <p className="flex-1 text-xs font-medium text-gray-200">{toast.message}</p>
            <button onClick={() => onRemove(toast.id)} className="text-gray-500 hover:text-white transition-colors">
                <X size={14} />
            </button>
        </div>
    );
};
