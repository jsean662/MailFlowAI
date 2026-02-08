import { useMailStore } from '../store/mailStore';
import { useUIStore } from '../store/uiStore';

// This function gathers relevant context for the Copilot
export const getCopilotContext = () => {
    const mailState = useMailStore.getState();
    const uiState = useUIStore.getState();

    return {
        currentView: window.location.pathname,
        selectedEmail: mailState.selectedEmail,
        composeDraft: uiState.composeDraft,
        inboxCount: mailState.inboxEmails.length,
        unreadCount: mailState.inboxEmails.filter(e => e.unread).length,
    };
};
