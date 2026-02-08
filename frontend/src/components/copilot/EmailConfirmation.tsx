import React from 'react';
import { Button } from '../common/Button';

interface EmailConfirmationProps {
    status: "inProgress" | "executing" | "complete";
    to: string;
    subject: string;
    body: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ status, to, subject, body, onConfirm, onCancel }) => {
    if (status === "complete") {
        return (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200 font-medium">Email sent successfully.</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col gap-3">
            <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-zinc-700 pb-2">Review Email</h3>

            <div className="space-y-2 text-sm">
                <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">To:</span> <span className="text-black dark:text-white">{to}</span>
                </div>
                <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Subject:</span> <span className="text-black dark:text-white">{subject}</span>
                </div>
                <div className="border p-2 rounded bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {body}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={onCancel}
                        variant="secondary"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={status === "executing"}
                        className="flex-1"
                    >
                        {status === "executing" ? 'Sending...' : 'Send Email'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
