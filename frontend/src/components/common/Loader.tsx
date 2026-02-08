import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="flex items-center justify-center p-8 bg-off-white dark:bg-zinc-900 border-2 border-black max-w-sm mx-auto shadow-brutal animate-pulse">
            <span className="font-display text-4xl font-bold uppercase tracking-widest text-black dark:text-off-white">
                Loading...
            </span>
        </div>
    );
};
