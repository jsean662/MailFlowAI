import React from 'react';
import { Button } from './Button';
import { X, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-zinc-900 border-3 border-black p-6 shadow-brutal-lg max-w-md w-full animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "p-2 border-2 border-black shadow-brutal-sm",
                            variant === 'danger' ? "bg-red-500" : "bg-orange-500"
                        )}>
                            <AlertTriangle className="h-6 w-6 text-black" />
                        </div>
                        <h2 className="text-xl font-display font-bold uppercase tracking-wide">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 border-2 border-transparent hover:border-black transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="mb-8">
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex gap-4 justify-end">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="px-6"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        variant="primary" // Re-using primary orange for consistency, or we could add a new variant for danger if needed in the future
                        className={clsx(
                            "px-6",
                            variant === 'danger' && "bg-red-500 hover:bg-red-600"
                        )}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
