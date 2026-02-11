import React from 'react';
import { gmailApi } from '../api/gmailApi';
import { Button } from '../components/common/Button';
import { Mail } from 'lucide-react';

import { PageMeta } from '../components/common/PageMeta';

export const LoginPage: React.FC = () => {
    const handleLogin = () => {
        window.location.href = gmailApi.loginUrl;
    };

    return (
        <div className="min-h-screen bg-orange-500 bg-vignette flex flex-col items-center justify-center p-4">
            <PageMeta title="Login" />
            <div className="bg-white p-6 md:p-8 border-3 md:border-4 border-black shadow-brutal md:shadow-brutal-lg max-w-md w-full text-center">
                <div className="mb-6 flex justify-center text-black">
                    <Mail className="w-12 h-12 md:w-16 md:h-16" strokeWidth={2.5} />
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-black mb-2 uppercase tracking-tighter">
                    MailFlow AI
                </h1>

                <p className="font-mono text-xs md:text-sm text-gray-600 mb-8 uppercase tracking-widest border-b-2 border-dashed border-gray-300 pb-4">
                    Experimental AI Mail Client
                </p>

                <Button
                    onClick={handleLogin}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="flex items-center justify-center gap-3 text-sm md:text-base py-3 md:py-4"
                >
                    <span>Connect Gmail Account</span>
                </Button>


            </div>
        </div>
    );
};
