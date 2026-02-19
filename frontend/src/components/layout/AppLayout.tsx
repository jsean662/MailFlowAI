import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useMailSync } from '../../hooks/useMailSync';
import { useMailStore } from '../../store/mailStore';
import { Menu, Mail } from 'lucide-react';
import { gmailApi } from '../../api/gmailApi';
import { Loader } from '../common/Loader';
import type { UserProfile } from '../../types/user';

import { Notification as AppNotification } from './Notification';
import { useCopilotIntegration } from '../../copilot/copilotContext';
import { CopilotPopup } from "@copilotkit/react-ui";

import { CopilotProcessingIndicator } from '../copilot/CopilotProcessingIndicator';

interface AppLayoutProps {
    disableCopilot?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ disableCopilot = false }) => {
    if (!disableCopilot) {
        useCopilotIntegration(); // Activate Copilot AI Actions
    }
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Check auth on mount
    const authChecked = React.useRef(false);

    useEffect(() => {
        if (authChecked.current) return;
        authChecked.current = true;

        const checkAuth = async () => {
            const isAuth = await gmailApi.checkAuthStatus();
            if (!isAuth) {
                navigate('/login');
                return;
            }

            // Fetch user profile
            try {
                const profile = await gmailApi.getUserProfile();
                setUserProfile(profile);
                useMailStore.getState().setUserProfile(profile);
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }

            setIsLoading(false);
        };
        checkAuth();
    }, [navigate]);

    // Sync emails every 30 seconds (only if auth check passes, but hook handles its own failures)
    useMailSync(30000);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-off-white dark:bg-zinc-900">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-off-white dark:bg-zinc-900 md:border-l-3 md:border-black">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-14 md:h-16 bg-off-white dark:bg-zinc-900 border-b-2 border-black flex items-center justify-between px-4 z-30 shadow-brutal-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-500 p-1 border-2 border-black shadow-brutal-sm">
                        <Mail className="h-5 w-5 text-black" />
                    </div>
                    <span className="font-display font-bold uppercase tracking-wider text-lg">MailFlow</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 active:scale-95 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded border-2 border-transparent hover:border-black transition-all"
                >
                    <div className="md:hidden">
                        <Menu size={24} />
                    </div>
                </button>
            </header>

            <AppNotification />

            <div className="flex-none">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    userProfile={userProfile}
                />
            </div>

            <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-6 pt-20 md:pt-8 bg-off-white dark:bg-zinc-900 relative">
                <div className="max-w-6xl mx-auto min-h-full">
                    <Outlet />
                </div>



                {!disableCopilot && (
                    <div className="z-50 font-sans">
                        <CopilotPopup
                            instructions="You are a helpful email assistant. Use the available tools to help the user manage their inbox."
                            labels={{
                                title: "MailFlow AI",
                                initial: "Hi! How can I help you with your email today?",
                            }}
                        />
                        <CopilotProcessingIndicator />
                    </div>
                )}
            </main>
        </div>
    );
};
