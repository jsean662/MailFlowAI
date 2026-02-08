import React from 'react';
import type { EmailPreview } from '../../types/email';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Star, ArrowUpRight } from 'lucide-react';

interface EmailListItemProps {
    email: EmailPreview;
}

export const EmailListItem: React.FC<EmailListItemProps> = ({ email }) => {
    return (
        <Link
            to={`/email/${email.id}`}
            className={clsx(
                'group block p-4 mb-3 border-2 border-black bg-white dark:bg-zinc-800 transition-all hover:-translate-y-1 hover:shadow-brutal',
                email.unread ? 'border-l-[6px] border-l-orange-500' : 'border-l-2'
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className={clsx(
                    "text-lg font-display truncate pr-4 text-black dark:text-off-white",
                    email.unread ? "font-bold" : "font-normal"
                )}>
                    {email.sender}
                </h3>
                <div className="relative">
                    <span className="text-xs font-mono text-gray-500 whitespace-nowrap transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2 block">
                        {new Date(email.date).toLocaleDateString()}
                    </span>
                    <ArrowUpRight
                        size={20}
                        className="text-orange-500 absolute top-0 right-0 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                    />
                </div>
            </div>

            <div className="mb-1">
                <span className={clsx("text-md text-black dark:text-gray-300", email.unread ? "font-semibold" : "")}>
                    {email.subject}
                </span>
            </div>

            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                {email.snippet}
            </p>

            {/* Decorative Star/Action - could be functional later */}
            <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Star size={16} className="text-gray-400 hover:text-orange-500 cursor-pointer" />
            </div>
        </Link>
    );
};
