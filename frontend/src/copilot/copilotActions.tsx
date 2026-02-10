
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useUIStore } from "../store/uiStore";
import { useMailStore } from "../store/mailStore";
import { gmailApi } from "../api/gmailApi";
import { EmailConfirmation } from "../components/copilot/EmailConfirmation";

export function useCopilotActions() {
    const {
        setComposeDraft,
        openComposePage,
        clearDraft,
        setNavigationTarget,
        setCopilotProcessing
    } = useUIStore();

    const {
        searchEmails: storeSearchEmails,
        setFilters,
        applySearchAndFilters,
        openEmail
    } = useMailStore();

    const { userProfile } = useMailStore();

    // 0. Provide Context to AI
    const { selectedEmail } = useMailStore();
    useCopilotReadable({
        description: "The currently logged-in user's profile. Use this to sign emails correctly.",
        value: userProfile,
    });

    useCopilotReadable({
        description: "The currently opened email that the user is viewing. Use this context when the user asks to reply to or forward the current email.",
        value: selectedEmail,
    });

    // 1. Compose Email
    useCopilotAction({
        name: "compose_email",
        description: "Open the compose window with pre-filled details. Use this when the user wants to write an email.",
        parameters: [
            {
                name: "to",
                type: "string",
                description: "Comma-separated list of recipients or single email",
                required: true
            },
            {
                name: "subject",
                type: "string",
                description: "Subject of the email",
                required: true
            },
            {
                name: "body",
                type: "string",
                description: "Body content of the email",
                required: true
            }
        ],
        handler: async ({ to, subject, body }) => {
            try {
                setCopilotProcessing(true);
                setComposeDraft({ to, subject, body });
                openComposePage();
                return "Compose window opened with draft.";
            } finally {
                setCopilotProcessing(false);
            }
        },
    });

    // 2. Send Email
    useCopilotAction({
        name: "send_email",
        description: "Send the email currently in the compose draft. ONLY use this if there is an active draft.",
        parameters: [],
        renderAndWaitForResponse: ({ status, respond }) => {
            const currentDraft = useUIStore.getState().composeDraft;

            return (
                <EmailConfirmation
                    status={status}
                    to={currentDraft.to}
                    subject={currentDraft.subject}
                    body={currentDraft.body}
                    onConfirm={async () => {
                        try {
                            setCopilotProcessing(true);
                            if (!currentDraft.to || !currentDraft.subject) {
                                respond?.("Error: Draft incomplete.");
                                return;
                            }

                            try {
                                await gmailApi.sendEmail({
                                    to: currentDraft.to.split(',').map((e: string) => e.trim()),
                                    subject: currentDraft.subject,
                                    body: currentDraft.body
                                });

                                clearDraft();
                                setNavigationTarget('/sent');
                                respond?.("Email sent successfully.");
                            } catch (error) {
                                console.error("Failed to send email:", error);
                                respond?.("Failed to send email. Please try again.");
                            }
                        } finally {
                            setCopilotProcessing(false);
                        }
                    }}
                    onCancel={() => respond?.("Email sending cancelled by user.")}
                />
            );
        },
    });

    // 3. Search Emails (Improved)
    useCopilotAction({
        name: "search_emails",
        description: `
        Search emails using structured filters AND/OR free text. 
        Update the UI filters so the user sees what is being searched.
        If the user provides a complex query that doesn't fit the slots, put it in 'keyword'.
        `,
        parameters: [
            {
                name: "keyword",
                type: "string",
                description: "Free text keyword OR raw Gmail query (e.g. 'category:updates'). Content to search in subject/body.",
                required: false,
            },
            {
                name: "from",
                type: "string",
                description: "Filter emails by sender email or name.",
                required: false,
            },
            {
                name: "dateWithinDays",
                type: "number",
                description: "Only show emails from the last N days (e.g., 7, 10, 30).",
                required: false,
            },
            {
                name: "status",
                type: "string",
                description: "Email read status filter: 'all', 'unread', or 'read'.",
                required: false,
            },
            {
                name: "hasAttachment",
                type: "boolean",
                description: "If true, only show emails that contain attachments.",
                required: false,
            },
        ],

        handler: async ({
            keyword,
            from,
            dateWithinDays,
            status = "all",
            hasAttachment = false,
        }) => {
            try {
                setCopilotProcessing(true);
                // 1. Build Gmail query (for API)
                const queryParts: string[] = [];

                if (keyword && keyword.trim().length > 0) queryParts.push(keyword.trim());
                if (from && from.trim().length > 0) queryParts.push(`from:${from.trim()}`);
                if (dateWithinDays && dateWithinDays > 0) queryParts.push(`newer_than:${dateWithinDays}d`);
                if (status === "unread") queryParts.push("is:unread");
                else if (status === "read") queryParts.push("is:read");
                if (hasAttachment) queryParts.push("has:attachment");

                const finalQuery = queryParts.join(" ").trim();
                console.log("🔍 Copilot Search Query:", finalQuery);

                // 2. Update UI Filters (for visibility)
                // We map the copilot params to the store's filter state
                setFilters({
                    keyword: keyword || '',
                    sender: from || '',
                    // If dateWithinDays is set, we map it to a duration string for the UI like '7d'
                    dateRange: dateWithinDays ? `${dateWithinDays}d` : 'all',
                    readStatus: (status as 'all' | 'read' | 'unread') || 'all',
                    hasAttachment: !!hasAttachment
                });

                // 3. Execute Search
                if (finalQuery) {
                    await storeSearchEmails(finalQuery);
                } else {
                    // If no query, maybe just clearing filters?
                    // But usually this action implies a search.
                    // We'll just search using the applied filters which might be empty => list all.
                    await applySearchAndFilters();
                }

                // 4. Navigate to Inbox
                setNavigationTarget("/inbox");

                return `Showing results for: "${finalQuery || 'all emails'}"`;
            } finally {
                setCopilotProcessing(false);
            }
        },
    });

    // 4. Open Email
    useCopilotAction({
        name: "open_email",
        description: "Open a specific email by searching for it first. Providing a search criteria helps find the right email.",
        parameters: [
            {
                name: "searchCriteria",
                type: "string",
                description: "Description or query to find the email (e.g., 'latest from Google', 'invoice from hopeful')",
                required: true
            }
        ],
        handler: async ({ searchCriteria }) => {
            try {
                setCopilotProcessing(true);
                // Find the email ID first
                const results = await gmailApi.searchEmails(searchCriteria);

                if (results && results.length > 0) {
                    const bestMatch = results[0];
                    await openEmail(bestMatch.id);
                    setNavigationTarget(`/email/${bestMatch.id}`);
                    return `Opened email from ${bestMatch.sender}: ${bestMatch.subject}`;
                } else {
                    return "No matching email found.";
                }
            } finally {
                setCopilotProcessing(false);
            }
        },
    });

    // 5. Reply to Current
    useCopilotAction({
        name: "reply_to_email",
        description: "Reply to the email currently being viewed. You can provide specific content for the reply to be pre-filled.",
        parameters: [
            {
                name: "responseContent",
                type: "string",
                description: "The content of the reply message.",
                required: false
            }
        ],
        handler: async ({ responseContent }) => {
            try {
                setCopilotProcessing(true);
                const current = useMailStore.getState().selectedEmail;
                if (!current) {
                    return "No email is currently open to reply to.";
                }
                useUIStore.getState().replyToCurrentEmail(current, responseContent);
                return "Reply draft created.";
            } finally {
                setCopilotProcessing(false);
            }
        },
    });

    // 6. Forward Email
    useCopilotAction({
        name: "forward_email",
        description: "Forward the email currently being viewed to another recipient.",
        parameters: [
            {
                name: "to",
                type: "string",
                description: "The email address to forward to.",
                required: true
            },
            {
                name: "message",
                type: "string",
                description: "Optional message to include above the forwarded content.",
                required: false
            }
        ],
        handler: async ({ to, message }) => {
            try {
                setCopilotProcessing(true);
                const current = useMailStore.getState().selectedEmail;
                if (!current) {
                    return "No email is currently open to forward.";
                }
                useUIStore.getState().forwardCurrentEmail(current, message, to);
                return "Forward draft created.";
            } finally {
                setCopilotProcessing(false);
            }
        },
    });

}
