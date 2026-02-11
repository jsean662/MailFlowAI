import React from 'react';
import { EmailList } from '../components/mail/EmailList';


import { PageMeta } from '../components/common/PageMeta';

export const InboxPage: React.FC = () => {




    return (
        <div>
            <PageMeta title="Inbox" />
            <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-2">
                <h2 className="text-4xl font-display font-bold uppercase">
                    Inbox
                </h2>
            </div>

            <EmailList type="inbox" />
        </div>
    );
};
