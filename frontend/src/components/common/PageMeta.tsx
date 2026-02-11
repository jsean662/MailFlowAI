import { useEffect } from 'react';

interface PageMetaProps {
    title: string;
}

export const PageMeta = ({ title }: PageMetaProps) => {
    useEffect(() => {
        document.title = `${title} - MailFlow.AI`;
    }, [title]);

    return null;
};
