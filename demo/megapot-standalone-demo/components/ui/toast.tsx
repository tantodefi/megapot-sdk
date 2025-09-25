'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

type ToastVariant = 'default' | 'success' | 'warning' | 'destructive';

type ToastItem = {
    id: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
};

type ToastOptions = {
    title?: string;
    description?: string;
    variant?: ToastVariant;
    durationMs?: number;
};

type ToastContextValue = {
    toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const toast = useCallback((options: ToastOptions) => {
        const id = Math.random().toString(36).slice(2);
        const next: ToastItem = {
            id,
            title: options.title,
            description: options.description,
            variant: options.variant ?? 'default',
        };
        setToasts((prev) => {
            const updated = [...prev, next];
            // Keep last 3 toasts max
            return updated.slice(-3);
        });
        const duration = options.durationMs ?? 3500;
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const value = useMemo(() => ({ toast }), [toast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto w-80 rounded-md border p-3 shadow-md bg-white ${
                            t.variant === 'destructive'
                                ? 'border-red-200'
                                : t.variant === 'success'
                                ? 'border-emerald-200'
                                : t.variant === 'warning'
                                ? 'border-yellow-200'
                                : 'border-gray-200'
                        }`}
                    >
                        {t.title && (
                            <div className="text-sm font-semibold text-gray-800">
                                {t.title}
                            </div>
                        )}
                        {t.description && (
                            <div className="text-sm text-gray-600 mt-1">
                                {t.description}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within <ToastProvider />');
    }
    return ctx;
}
