
import { create } from 'zustand';
import type { EmailPreview, EmailDetail } from '../types/email';
import { gmailApi } from '../api/gmailApi';
import { useUIStore } from './uiStore';

interface MailState {
    // Email Data
    inboxEmails: EmailPreview[];
    sentEmails: EmailPreview[];
    searchResults: EmailPreview[] | null;
    searchQuery: string | null;
    selectedEmail: EmailDetail | null;

    // Pagination State
    inboxPage: number;
    sentPage: number;
    inboxNextPageToken: string | null;
    sentNextPageToken: string | null;
    inboxTokens: Record<number, string | null>;
    sentTokens: Record<number, string | null>;

    // UI State
    isLoading: boolean;
    error: string | null;

    // Filter State
    filters: {
        keyword: string;
        sender: string;
        dateRange: "all" | "1d" | "3d" | "7d" | "14d" | "1m" | "2m" | "6m" | "1y";
        dateCenter: string;
        readStatus: "all" | "unread" | "read";
        hasAttachment: boolean;
    };

    // New Email Detection
    inboxSnapshot: EmailPreview[];
    newEmailsCount: number;
    resetNewEmailsCount: () => void;

    // Actions
    nextPage: (type: 'inbox' | 'sent') => Promise<void>;
    prevPage: (type: 'inbox' | 'sent') => Promise<void>;
    fetchInbox: (pageToken?: string, silent?: boolean) => Promise<void>;
    fetchSent: (pageToken?: string, silent?: boolean) => Promise<void>;
    checkNewEmails: () => Promise<void>;
    openEmail: (id: string) => Promise<void>;
    searchEmails: (query: string) => Promise<void>;
    clearSearch: () => void;

    // New Search & Filter Actions
    setKeyword: (keyword: string) => void;
    setFilters: (filters: Partial<MailState['filters']>) => void;
    applySearchAndFilters: () => Promise<void>;
    clearFilters: () => Promise<void>;
    // User Profile
    userProfile: { name: string; email: string } | null;
    setUserProfile: (profile: { name: string; email: string }) => void;

    // Actions
    deleteEmail: (id: string) => Promise<void>;
    replyToEmail: (id: string, body: string) => Promise<void>;
    forwardEmail: (id: string, to: string[], body: string) => Promise<void>;
}

export const useMailStore = create<MailState>((set, get) => ({
    inboxEmails: [],
    sentEmails: [],
    inboxNextPageToken: null,
    sentNextPageToken: null,
    searchResults: null,
    searchQuery: null,
    selectedEmail: null,
    isLoading: false,
    error: null,

    // New Email Detection
    inboxSnapshot: [],
    newEmailsCount: 0,
    resetNewEmailsCount: () => {
        set({
            newEmailsCount: 0
        });
    },

    inboxPage: 1,
    sentPage: 1,
    inboxTokens: { 1: null },
    sentTokens: { 1: null },

    filters: {
        keyword: '',
        sender: '',
        dateRange: 'all',
        dateCenter: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        readStatus: 'all',
        hasAttachment: false,
    },

    async nextPage(type) {
        const state = get();
        const currentPage = type === 'inbox' ? state.inboxPage : state.sentPage;
        const nextPageNum = currentPage + 1;

        // We need the token that fetches the *next* page.
        // That token was returned by the *current* page fetch and stored in state.inboxNextPageToken / sentNextPageToken
        // However, we should have stored it in our tokens map when we fetched the current page.

        // Actually, let's look at the tokens map.
        // tokens[1] = null (fetching page 1 requires no token)
        // fetching page 1 returns a nextPageToken. This is the token for page 2.
        // So tokens[2] = response.nextPageToken.

        const tokens = type === 'inbox' ? state.inboxTokens : state.sentTokens;
        const nextToken = tokens[nextPageNum];

        if (nextToken === undefined) {
            // If we don't have a token for the next page, we can't go there unless we just fetched it and forgot to save it, 
            // or we are relying on the *current* fetch's result.
            // Let's rely on the store's current `nextPageToken` which is from the latest fetch.
            const currentNextToken = type === 'inbox' ? state.inboxNextPageToken : state.sentNextPageToken;
            if (!currentNextToken) return; // No next page available

            // Update the token map for the *next* page
            if (type === 'inbox') {
                set(s => ({ inboxTokens: { ...s.inboxTokens, [nextPageNum]: currentNextToken } }));
            } else {
                set(s => ({ sentTokens: { ...s.sentTokens, [nextPageNum]: currentNextToken } }));
            }
        }

        // Update page state immediately to show UI intent or wait? Better wait for fetch or optimistic? 
        // Let's optimistic update the page number BUT handle error by reverting? 
        // Simpler: just set page and fetch.

        if (type === 'inbox') {
            set({ inboxPage: nextPageNum });
            // The token for Page N is stored in tokens[N]
            // wait, we just ensured tokens[nextPageNum] is set above.
            // But we can't access updated state in the same tick easily without get().
            // Let's re-get or just use the value.
            // Accessing the newly set token
            // const tokenToUse = (get().inboxTokens)[nextPageNum] || null;
            // Wait, if nextToken was undefined, we set it in the if block.
            // Let's just pass the token directly to fetch.
            const currentNextToken = state.inboxNextPageToken;
            await get().fetchInbox(currentNextToken || undefined);
        } else {
            set({ sentPage: nextPageNum });
            const currentNextToken = state.sentNextPageToken;
            await get().fetchSent(currentNextToken || undefined);
        }
    },

    async prevPage(type) {
        const state = get();
        const currentPage = type === 'inbox' ? state.inboxPage : state.sentPage;
        if (currentPage <= 1) return;

        const prevPageNum = currentPage - 1;

        if (type === 'inbox') {
            set({ inboxPage: prevPageNum });
            const token = state.inboxTokens[prevPageNum];
            // If token is null, it means page 1 (which is correct). 
            // If undefined, that's an error state but shouldn't happen if we visited it.
            await get().fetchInbox(token || undefined);
        } else {
            set({ sentPage: prevPageNum });
            const token = state.sentTokens[prevPageNum];
            await get().fetchSent(token || undefined);
        }
    },

    fetchInbox: async (pageToken?: string, silent: boolean = false) => {
        if (!silent) set({ isLoading: true, error: null });
        try {
            const data = await gmailApi.getInbox(pageToken);
            set((state) => {
                const nextPageNum = state.inboxPage + 1;

                let newEmailsCount = state.newEmailsCount;
                let inboxSnapshot = state.inboxSnapshot;

                // Sync Logic: Check for new emails only on first page
                if (!pageToken && state.inboxPage === 1) {
                    if (state.inboxSnapshot.length === 0) {
                        // Initial load or background init
                        inboxSnapshot = data.messages;
                    } else if (silent) {
                        // Background sync
                        const snapshotIds = new Set(state.inboxSnapshot.map(e => e.id));
                        const newEmails = data.messages.filter(e => !snapshotIds.has(e.id));

                        if (newEmails.length > 0) {
                            newEmailsCount += newEmails.length;
                            inboxSnapshot = data.messages; // Update snapshot to avoid recounting

                            // Trigger Notification
                            useUIStore.getState().showNotification(
                                `You have ${newEmails.length} new email${newEmails.length > 1 ? 's' : ''}`,
                                'info'
                            );
                        }
                    } else {
                        // Manual refresh - reset count as user sees new list
                        inboxSnapshot = data.messages;
                        newEmailsCount = 0;
                    }
                }

                return {
                    inboxEmails: data.messages,
                    inboxNextPageToken: data.nextPageToken,
                    inboxTokens: { ...state.inboxTokens, [nextPageNum]: data.nextPageToken },
                    isLoading: false,
                    inboxSnapshot,
                    newEmailsCount
                };
            });
        } catch {
            set({ error: 'Failed to fetch inbox', isLoading: false });
        }
    },

    checkNewEmails: async () => {
        const state = get();
        // Only check if we have an initial snapshot
        if (state.inboxSnapshot.length === 0) {
            // If no snapshot, just fetch inbox silently to populate it
            await state.fetchInbox(undefined, true);
            return;
        }

        try {
            // Fetch latest page 1 without affecting current UI state
            const data = await gmailApi.getInbox();

            const snapshotIds = new Set(state.inboxSnapshot.map(e => e.id));
            const newEmails = data.messages.filter(e => !snapshotIds.has(e.id));

            if (newEmails.length > 0) {
                const isInboxView = state.inboxPage === 1 && !state.searchQuery;

                if (isInboxView) {
                    set((s) => ({
                        inboxEmails: data.messages,
                        inboxSnapshot: data.messages,
                        newEmailsCount: 0,
                        inboxNextPageToken: data.nextPageToken,
                        inboxTokens: { ...s.inboxTokens, 2: data.nextPageToken }
                    }));
                } else {
                    useUIStore.getState().showNotification(
                        `You have ${newEmails.length} new email${newEmails.length > 1 ? 's' : ''}`,
                        'info'
                    );

                    set((s) => ({
                        newEmailsCount: s.newEmailsCount + newEmails.length,
                        inboxSnapshot: data.messages
                    }));
                }
            } else {
                set({ inboxSnapshot: data.messages });
            }
        } catch (error) {
            console.error('Failed to check for new emails', error);
        }
    },

    fetchSent: async (pageToken?: string, silent: boolean = false) => {
        if (!silent) set({ isLoading: true, error: null });
        try {
            const data = await gmailApi.getSent(pageToken);
            set((state) => {
                const nextPageNum = state.sentPage + 1;
                return {
                    sentEmails: data.messages, // REPLACE
                    sentNextPageToken: data.nextPageToken,
                    sentTokens: { ...state.sentTokens, [nextPageNum]: data.nextPageToken },
                    isLoading: false
                };
            });
        } catch {
            set({ error: 'Failed to fetch sent emails', isLoading: false });
        }
    },

    openEmail: async (id: string) => {
        set({ isLoading: true, error: null, selectedEmail: null });
        try {
            const email = await gmailApi.getMessage(id);
            set({ selectedEmail: email, isLoading: false });
        } catch {
            set({ error: 'Failed to open email', isLoading: false });
        }
    },

    searchEmails: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: null });
            return;
        }
        set({ isLoading: true, error: null });
        try {
            const results = await gmailApi.searchEmails(query);
            set({ searchResults: results, searchQuery: query, isLoading: false });
        } catch {
            set({ error: 'Failed to search emails', isLoading: false });
        }
    },

    clearSearch: () => set({ searchResults: null, searchQuery: null }),

    setKeyword: (keyword) => set((state) => ({
        filters: { ...state.filters, keyword }
    })),

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),

    applySearchAndFilters: async () => {
        const { filters } = get();
        const { buildGmailQuery } = await import('../utils/gmailQueryBuilder');
        const query = buildGmailQuery(filters);

        if (!query.trim()) {
            await get().clearFilters();
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const results = await gmailApi.searchEmails(query);
            set({
                // DO NOT OVERWRITE INBOX EMAILS!
                searchResults: results,
                searchQuery: query,
                isLoading: false,
            });
        } catch {
            set({ error: 'Failed to apply filters', isLoading: false });
        }
    },

    clearFilters: async () => {
        set({
            filters: {
                keyword: '',
                sender: '',
                dateRange: 'all',
                dateCenter: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                readStatus: 'all',
                hasAttachment: false,
            },
            searchQuery: null,
            searchResults: null
        });
        await get().fetchInbox();
    },

    userProfile: null,
    setUserProfile: (profile) => set({ userProfile: profile }),

    deleteEmail: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await gmailApi.delete(id);
            // Remove from list
            set(state => ({
                inboxEmails: state.inboxEmails.filter(e => e.id !== id),
                sentEmails: state.sentEmails.filter(e => e.id !== id),
                selectedEmail: state.selectedEmail?.id === id ? null : state.selectedEmail,
                isLoading: false
            }));
        } catch {
            set({ error: 'Failed to delete email', isLoading: false });
        }
    },

    replyToEmail: async (id: string, body: string) => {
        set({ isLoading: true, error: null });
        try {
            await gmailApi.reply(id, { body });
            set({ isLoading: false });
        } catch {
            set({ error: 'Failed to reply to email', isLoading: false });
            throw new Error('Failed to reply');
        }
    },

    forwardEmail: async (id: string, to: string[], body: string) => {
        set({ isLoading: true, error: null });
        try {
            await gmailApi.forward(id, { to, body });
            set({ isLoading: false });
        } catch {
            set({ error: 'Failed to forward email', isLoading: false });
            throw new Error('Failed to forward');
        }
    }
}));
