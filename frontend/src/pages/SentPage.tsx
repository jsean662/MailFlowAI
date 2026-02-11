import React from 'react';
import { EmailList } from '../components/mail/EmailList';


import { PageMeta } from '../components/common/PageMeta';

export const SentPage: React.FC = () => {


    return (
        <div>
            <PageMeta title="Sent" />
            <h2 className="text-4xl font-display font-bold uppercase mb-8 border-b-4 border-black pb-2 inline-block">
                Sent
            </h2>
            <EmailList type="sent" />
        </div>
    );
};
