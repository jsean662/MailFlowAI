import { useEffect } from 'react';
import { useMailStore } from '../store/mailStore';

export const useMailSync = (intervalMs: number = 10000) => {
    const { checkNewEmails } = useMailStore();

    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log('Checking for new emails...');
            checkNewEmails();
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [checkNewEmails, intervalMs]);
};
