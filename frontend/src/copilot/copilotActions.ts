import { useMailStore } from '../store/mailStore';
import { useUIStore } from '../store/uiStore';

export const copilotActions = {
    // Action: "Compose an email to [person] about [topic]"
    composeEmail: (to: string, subject: string, body: string) => {
        useUIStore.getState().updateDraft({ to, subject, body });
        // In a real integration, we might navigate to /compose here
        if (!window.location.pathname.includes('/compose')) {
            window.location.href = '/compose';
        }
    },

    // Action: "Search for emails from [sender]"
    searchEmails: (query: string) => {
        useMailStore.getState().searchEmails(query);
    },

    // Action: "Read the email from [sender]"
    // This is tricky as we need an ID. Copilot usually needs context of list.
    openEmail: (emailId: string) => {
        // Navigate logic would be here
        window.location.href = `/email/${emailId}`;
    },

    // Action: "Delete this email"
    deleteCurrentEmail: async () => {
        const { selectedEmail } = useMailStore.getState();
        if (selectedEmail) {
            console.log(`Deleting email ${selectedEmail.id}`);
            // await gmailApi.deleteMessage(selectedEmail.id);
        }
    }
};
