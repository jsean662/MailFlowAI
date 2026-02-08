import React from 'react';
import { gmailApi } from '../api/gmailApi';
import { Button } from '../components/common/Button';
import { Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const handleLogin = () => {
        window.location.href = gmailApi.loginUrl;
    };

    return (
        <div className="min-h-screen bg-orange-500 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 border-4 border-black shadow-brutal-lg max-w-md w-full text-center">
                <div className="mb-6 flex justify-center text-black">
                    <Mail size={64} strokeWidth={2.5} />
                </div>

                <h1 className="font-display text-4xl font-bold mb-2 uppercase tracking-tighter">
                    MailFlow AI
                </h1>

                <p className="font-mono text-sm text-gray-500 mb-8 uppercase tracking-widest border-b-2 border-dashed border-gray-300 pb-4">
                    Experimental AI Mail Client
                </p>

                <Button
                    onClick={handleLogin}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="flex items-center justify-center gap-3"
                >
                    <span>Connect Gmail Account</span>
                </Button>


            </div>
        </div>
    );
};
