import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useMailStore } from '../../store/mailStore';
import { Loader } from '../common/Loader';
import { ArrowLeft, UserCircle, Calendar } from 'lucide-react';
import { Button } from '../common/Button';

export const EmailDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { selectedEmail, openEmail, isLoading, error, deleteEmail, replyToEmail, forwardEmail } = useMailStore();

    const [action, setAction] = React.useState<'none' | 'reply' | 'forward'>('none');
    const [body, setBody] = React.useState('');
    const [forwardTo, setForwardTo] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);

    const handleAction = async () => {
        if (!selectedEmail) return;
        setIsSending(true);
        try {
            if (action === 'reply') {
                await replyToEmail(selectedEmail.id, body);
            } else if (action === 'forward') {
                await forwardEmail(selectedEmail.id, [forwardTo], body);
            }
            alert('Sent successfully!');
            setAction('none');
            setBody('');
            setForwardTo('');
        } catch (e) {
            alert('Failed to send');
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEmail || !confirm('Are you sure you want to delete this email?')) return;
        await deleteEmail(selectedEmail.id);
        navigate(-1);
    };

    useEffect(() => {
        if (id) {
            openEmail(id);
        }
    }, [id, openEmail]);

    if (isLoading) return <Loader />;

    if (error || !selectedEmail) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error || 'Email not found'}</h2>
                <Button onClick={() => navigate(-1)} variant="secondary">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animation-fade-in">
            {/* Header Actions */}
            <div className="mb-6 flex items-center justify-between">
                <Button onClick={() => navigate(-1)} variant="secondary" size="sm" className="flex items-center gap-2">
                    <ArrowLeft size={16} /> Back
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant={action === 'reply' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setAction(action === 'reply' ? 'none' : 'reply')}
                    >
                        Reply
                    </Button>
                    <Button
                        variant={action === 'forward' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setAction(action === 'forward' ? 'none' : 'forward')}
                    >
                        Forward
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
                </div>
            </div>



            {/* Action Area */}
            {
                action !== 'none' && (
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-zinc-900 border-2 border-black">
                        <h3 className="font-bold mb-2 capitalize">{action} to Email</h3>

                        {action === 'forward' && (
                            <input
                                type="email"
                                placeholder="To (email address)"
                                className="w-full mb-2 p-2 border-2 border-black"
                                value={forwardTo}
                                onChange={e => setForwardTo(e.target.value)}
                            />
                        )}

                        <textarea
                            className="w-full h-32 p-2 border-2 border-black mb-2 resize-none"
                            placeholder="Type your message..."
                            value={body}
                            onChange={e => setBody(e.target.value)}
                        />

                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setAction('none')}>Cancel</Button>
                            <Button onClick={handleAction} disabled={isSending}>
                                {isSending ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </div>
                )
            }

            {/* Email Content Card */}
            <article className="bg-white dark:bg-zinc-800 border-2 border-black p-8 shadow-brutal-lg relative">
                {/* Subject */}
                <h1 className="text-3xl font-display font-bold mb-6 text-black dark:text-off-white border-b-2 border-black pb-4 sensitive-data">
                    {selectedEmail.subject}
                </h1>

                {/* Meta */}
                <div className="flex items-center justify-between mb-8 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                        <UserCircle size={40} className="text-orange-500" />
                        <div>
                            <span className="block font-bold text-black dark:text-white sensitive-data">{selectedEmail.sender}</span>
                            <span className="text-xs font-mono">To: You</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm">
                        <Calendar size={16} />
                        {new Date(selectedEmail.date).toLocaleString()}
                    </div>
                </div>

                {/* Body */}
                <div className="prose prose-lg dark:prose-invert max-w-none font-sans leading-relaxed">
                    {/* Using dangerouslySetInnerHTML if body is HTML, otherwise just text */}
                    {/* For safety in this demo we'll assume text or sanitized HTML */}
                    <div
                        className="email-body sensitive-data"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body) }}
                    />
                </div>
            </article>
        </div >
    );
};
