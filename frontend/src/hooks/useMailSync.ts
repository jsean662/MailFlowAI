import { useEffect } from 'react';
import { useMailStore } from '../store/mailStore';

export const useMailSync = (intervalMs: number = 10000) => {
    const { checkNewEmails } = useMailStore();

    useEffect(() => {
        const intervalId = setInterval(() => {
            checkNewEmails();
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [checkNewEmails, intervalMs]);
};
