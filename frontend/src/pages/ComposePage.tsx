import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { gmailApi } from '../api/gmailApi';
import { Input, TextArea } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { Send, Trash } from 'lucide-react';
import { useMailStore } from '../store/mailStore';

export const ComposePage: React.FC = () => {
    const { composeDraft, updateDraft, clearDraft } = useUIStore();
    const { fetchSent, checkNewEmails } = useMailStore(); // To refresh sent folder
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSend = async () => {
        if (!composeDraft.to || !composeDraft.subject || !composeDraft.body) {
            setError('All fields are required.');
            return;
        }

        setSending(true);
        setError(null);
        try {
            await gmailApi.sendEmail({
                to: composeDraft.to.split(',').map(e => e.trim()),
                subject: composeDraft.subject,
                body: composeDraft.body,
            });
            clearDraft();
            // Invalidate sent cache or pre-fetch
            fetchSent();
            checkNewEmails();
            navigate('/sent');
        } catch (err) {
            console.error(err);
            setError('Failed to send email. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 border-2 border-black p-8 shadow-brutal-lg">
            <h2 className="text-3xl font-display font-bold uppercase mb-8 border-b-2 border-black pb-4">
                Compose Email
            </h2>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <Input
                    label="To"
                    placeholder="recipient@example.com"
                    value={composeDraft.to}
                    onChange={(e) => updateDraft({ to: e.target.value })}
                />

                <Input
                    label="Subject"
                    placeholder="What is this about?"
                    value={composeDraft.subject}
                    onChange={(e) => updateDraft({ subject: e.target.value })}
                />

                <TextArea
                    label="Message"
                    placeholder="Type your message here..."
                    rows={12}
                    value={composeDraft.body}
                    onChange={(e) => updateDraft({ body: e.target.value })}
                    className="font-mono text-sm leading-relaxed"
                />

                <div className="flex justify-between pt-6 border-t-2 border-gray-100 mt-8">
                    <Button
                        onClick={clearDraft}
                        variant="secondary"
                        size="md"
                        className="flex items-center gap-2"
                        disabled={sending}
                    >
                        <Trash size={18} /> Discard
                    </Button>

                    <Button
                        onClick={handleSend}
                        variant="primary"
                        size="lg"
                        className="flex items-center gap-2"
                        disabled={sending}
                    >
                        {sending ? (
                            <>Sending...</>
                        ) : (
                            <><Send size={18} /> Send Email</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
