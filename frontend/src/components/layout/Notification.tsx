import React from 'react';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import clsx from 'clsx';

export const Notification: React.FC = () => {
    const { notification, clearNotification } = useUIStore();

    if (!notification) return null;

    return (
        <div className="fixed top-24 right-4 z-[100] animate-bounce-in md:top-8">
            <div className={clsx(
                "flex items-center gap-3 px-6 py-4 border-4 border-black shadow-brutal min-w-[300px]",
                notification.type === 'success' && "bg-green-400",
                notification.type === 'error' && "bg-red-400",
                notification.type === 'info' && "bg-yellow-300"
            )}>
                <div className="p-1 bg-black text-white shrink-0">
                    {notification.type === 'success' && <CheckCircle size={20} />}
                    {notification.type === 'error' && <AlertTriangle size={20} />}
                    {notification.type === 'info' && <Info size={20} />}
                </div>

                <span className="font-display font-bold uppercase tracking-wide flex-1 text-black">
                    {notification.message}
                </span>

                <button
                    onClick={clearNotification}
                    className="hover:bg-black hover:text-white p-1 transition-colors border-2 border-transparent hover:border-transparent"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
