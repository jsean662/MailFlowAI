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
    const { selectedEmail, openEmail, isLoading, error } = useMailStore();

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
                    <Button variant="secondary" size="sm">Reply</Button>
                    <Button variant="secondary" size="sm">Forward</Button>
                    <Button variant="danger" size="sm">Delete</Button>
                </div>
            </div>

            {/* Email Content Card */}
            <article className="bg-white dark:bg-zinc-800 border-2 border-black p-8 shadow-brutal-lg relative">
                {/* Subject */}
                <h1 className="text-3xl font-display font-bold mb-6 text-black dark:text-off-white border-b-2 border-black pb-4">
                    {selectedEmail.subject}
                </h1>

                {/* Meta */}
                <div className="flex items-center justify-between mb-8 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                        <UserCircle size={40} className="text-orange-500" />
                        <div>
                            <span className="block font-bold text-black dark:text-white">{selectedEmail.sender}</span>
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
                        className="email-body"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body) }}
                    />
                </div>
            </article>
        </div>
    );
};
