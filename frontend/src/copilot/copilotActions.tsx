
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
        setNavigationTarget
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
            setComposeDraft({ to, subject, body });
            openComposePage();
            return "Compose window opened with draft.";
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
                    }}
                    onCancel={() => respond?.("Email sending cancelled by user.")}
                />
            );
        },
    });

    // 3. Search Emails
    useCopilotAction({
        name: "search_emails",
        description: "Search for emails in the inbox using a query string.",
        parameters: [
            {
                name: "query",
                type: "string",
                description: "The search query (e.g., 'from:john', 'subject:meeting')",
                required: true
            }
        ],
        handler: async ({ query }) => {
            await storeSearchEmails(query);
            // Ensure we are on the inbox page to see results
            setNavigationTarget('/inbox');
            return `Search completed for '${query}'. Results shown in Inbox.`;
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
            const current = useMailStore.getState().selectedEmail;
            if (!current) {
                return "No email is currently open to reply to.";
            }
            useUIStore.getState().replyToCurrentEmail(current, responseContent);
            return "Reply draft created.";
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
            const current = useMailStore.getState().selectedEmail;
            if (!current) {
                return "No email is currently open to forward.";
            }
            useUIStore.getState().forwardCurrentEmail(current, message, to);
            return "Forward draft created.";
        },
    });

    // 6. Filter Inbox
    useCopilotAction({
        name: "filter_inbox",
        description: "Filter the inbox view. Usage: User can specify a duration (e.g. '3 days') and optionally a start date. If the user specifies a duration NOT in {1d, 3d, 7d, 14d, 1m, 2m, 6m, 1y} (e.g. '4 days'), you MUST explain that only specific durations are allowed and ask them to choose one, DO NOT guess.",
        parameters: [
            {
                name: "readStatus",
                type: "string",
                description: "'read', 'unread', or 'all'",
            },
            {
                name: "dateRange",
                type: "string",
                description: "Duration of the filter starting from the startDate. Examples: '1d', '3d', '4d', '7d', '14d', '1m', '2m'. Defaults to '1d' if not specified.",
            },
            {
                name: "startDate",
                type: "string",
                description: "The start date for the filter in YYYY/MM/DD format. Defaults to today if not specified.",
            },
            {
                name: "sender",
                type: "string",
                description: "Sender email address or name",
            },
            {
                name: "keyword",
                type: "string",
                description: "Keyword to search for",
            },
            {
                name: "hasAttachment",
                type: "boolean",
                description: "Filter by having attachment",
            }
        ],
        handler: async ({ readStatus, dateRange, startDate, sender, keyword, hasAttachment }) => {
            const currentFilters = useMailStore.getState().filters;

            // Construct new filters
            const newFilters = {
                ...currentFilters,
                ...(readStatus && { readStatus: readStatus as any }),
                ...(dateRange && { dateRange: dateRange as any }),
                ...(startDate && { dateCenter: startDate }), // Map startDate to dateCenter
                ...(sender && { sender }),
                ...(keyword && { keyword }),
                ...(hasAttachment !== undefined && { hasAttachment })
            };

            setFilters(newFilters);
            await applySearchAndFilters();

            // Ensure we are on the inbox page to see results
            setNavigationTarget('/inbox');
            return "Inbox filtered and displayed.";
        },
    });
}
