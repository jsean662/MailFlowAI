import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    ...props
}) => {
    return (
        <button
            className={twMerge(
                clsx(
                    // Base styles
                    'font-display font-bold uppercase tracking-wider border-2 border-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                    // Variants
                    {
                        'bg-orange-500 text-black shadow-brutal hover:bg-orange-600': variant === 'primary',
                        'bg-off-white text-black shadow-brutal hover:bg-gray-100': variant === 'secondary',
                        'bg-red-500 text-white shadow-brutal hover:bg-red-600': variant === 'danger',
                    },
                    // Sizes
                    {
                        'px-3 py-1 text-xs': size === 'sm',
                        'px-6 py-2 text-sm': size === 'md',
                        'px-8 py-3 text-base': size === 'lg',
                    },
                    // Full width
                    {
                        'w-full': fullWidth,
                    }
                ),
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
