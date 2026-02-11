import React, { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { Sun, Moon } from 'lucide-react';
import { Button } from '../common/Button';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme, initializeTheme } = useUIStore();

    useEffect(() => {
        initializeTheme();
    }, [initializeTheme]);

    return (
        <Button
            onClick={toggleTheme}
            variant="secondary"
            fullWidth
            className={`flex items-center justify-center gap-2 px-3 py-2 text-sm ${theme === 'dark'
                    ? '!bg-zinc-900 !text-white hover:!bg-zinc-800'
                    : ''
                }`}
            title="Toggle Theme"
        >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="uppercase">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </Button>
    );
};
