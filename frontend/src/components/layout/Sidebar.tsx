import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Inbox, Send, Pencil, Mail, X, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import type { UserProfile } from '../../types/user';
import { gmailApi } from '../../api/gmailApi';
import { useMailStore } from '../../store/mailStore';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, userProfile }) => {
    const navigate = useNavigate();
    const { newEmailsCount, resetNewEmailsCount } = useMailStore();

    const navItems = [
        { name: 'Inbox', path: '/inbox', icon: Inbox, count: newEmailsCount },
        { name: 'Sent', path: '/sent', icon: Send },
    ];

    const handleLogout = async () => {
        try {
            await gmailApi.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-off-white dark:bg-zinc-900 border-r-3 border-black flex flex-col p-4 shadow-brutal-lg transition-transform duration-300 md:translate-x-0 md:relative md:h-full",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header / Brand */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-500 p-2 border-2 border-black shadow-brutal-sm">
                            <Mail className="h-6 w-6 text-black" />
                        </div>
                        <h1 className="text-xl font-display font-bold uppercase tracking-wider">MailFlow</h1>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded">
                        <X size={24} />
                    </button>
                </div>

                {/* Compose Button - Prominent */}
                <Link
                    to="/compose"
                    onClick={onClose}
                    className="mb-8 w-full flex items-center justify-center gap-2 bg-orange-500 text-black font-display font-bold py-3 px-4 border-2 border-black shadow-brutal hover:bg-orange-600 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                    <Pencil size={20} />
                    <span>COMPOSE</span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                onClose();
                                if (item.name === 'Inbox') resetNewEmailsCount();
                            }}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-4 py-3 font-display font-medium border-2 border-transparent hover:bg-white dark:hover:bg-zinc-800 transition-colors',
                                    isActive
                                        ? 'bg-white dark:bg-zinc-800 border-black shadow-brutal-sm translate-x-[2px] translate-y-[-2px]'
                                        : 'text-gray-600 dark:text-gray-400 hover:border-black'
                                )
                            }
                        >
                            <item.icon size={20} />
                            <span className="uppercase tracking-wide">{item.name}</span>
                            {item.name === 'Inbox' && item.count !== undefined && item.count > 0 && (
                                <span className="ml-auto bg-orange-500 text-black text-xs font-bold px-2 py-0.5 border border-black shadow-brutal-xs">
                                    {item.count}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="mt-auto space-y-3">
                    {/* User Profile */}
                    {userProfile && (
                        <div className="px-2 py-3 border-2 border-black bg-white dark:bg-zinc-800 shadow-brutal-sm">
                            <div className="flex items-center gap-3 mb-2">
                                {userProfile.picture ? (
                                    <img
                                        src={userProfile.picture}
                                        alt={userProfile.name}
                                        className="w-10 h-10 rounded-full border-2 border-black"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full border-2 border-black bg-orange-500 flex items-center justify-center">
                                        <User className="h-5 w-5 text-black" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-display font-bold text-sm truncate">{userProfile.name}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{userProfile.email}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-black font-display font-bold text-sm border-2 border-black shadow-brutal hover:bg-orange-600 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                <LogOut size={16} />
                                <span className="uppercase">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};
