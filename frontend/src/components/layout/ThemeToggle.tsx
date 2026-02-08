import React, { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme, initializeTheme } = useUIStore();

    useEffect(() => {
        initializeTheme();
    }, [initializeTheme]);

    return (
        <button
            onClick={toggleTheme}
            className="p-2 border-2 border-black bg-off-white dark:bg-zinc-800 text-black dark:text-off-white shadow-brutal hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Toggle Theme"
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
};
