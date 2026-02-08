import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    className?: string;
    inputClassName?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, inputClassName, ...props }) => {
    return (
        <div className={clsx('flex flex-col', className)}>
            {label && (
                <label
                    htmlFor={props.id}
                    className="mb-1 text-sm font-bold uppercase tracking-wider text-black dark:text-off-white"
                >
                    {label}
                </label>
            )}
            <input
                className={twMerge(
                    'p-2 bg-white dark:bg-zinc-800 text-black dark:text-off-white font-sans border-2 border-black focus:outline-none focus:shadow-brutal transition-all placeholder:text-gray-500',
                    inputClassName,
                    props.disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-900'
                )}
                {...props}
            />
        </div>
    );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    className?: string;
    inputClassName?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className, inputClassName, ...props }) => {
    return (
        <div className={clsx('flex flex-col', className)}>
            {label && (
                <label
                    htmlFor={props.id}
                    className="mb-1 text-sm font-bold uppercase tracking-wider text-black dark:text-off-white"
                >
                    {label}
                </label>
            )}
            <textarea
                className={twMerge(
                    'p-2 bg-white dark:bg-zinc-800 text-black dark:text-off-white font-sans border-2 border-black focus:outline-none focus:shadow-brutal transition-all placeholder:text-gray-500',
                    inputClassName,
                    props.disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-900'
                )}
                {...props}
            />
        </div>
    );
};
