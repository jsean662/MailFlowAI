import { apiClient as client } from './client';
import type { EmailPreview, EmailDetail, SendEmailPayload, PaginatedResponse, ReplyEmailPayload, ForwardEmailPayload } from '../types/email';
import type { UserProfile } from '../types/user';
import { env } from '../config/env';

export const gmailApi = {
    // Auth
    loginUrl: `${env.BACKEND_URL}/auth/login`,

    checkAuthStatus: async (): Promise<boolean> => {
        try {
            const response = await client.get<{ authenticated: boolean }>('/auth/status');
            return response.data.authenticated;
        } catch {
            return false;
        }
    },

    getUserProfile: async (): Promise<UserProfile> => {
        const response = await client.get<UserProfile>('/auth/me');
        return response.data;
    },

    logout: async () => {
        await client.get('/auth/logout');
    },

    // Email Operations
    getInbox: async (pageToken?: string): Promise<PaginatedResponse> => {
        const response = await client.get<PaginatedResponse>('/gmail/inbox', {
            params: { page_token: pageToken }
        });
        return response.data;
    },

    getSent: async (pageToken?: string): Promise<PaginatedResponse> => {
        const response = await client.get<PaginatedResponse>('/gmail/sent', {
            params: { page_token: pageToken }
        });
        return response.data;
    },

    getMessage: async (id: string): Promise<EmailDetail> => {
        const response = await client.get<EmailDetail>(`/gmail/messages/${id}`);
        return response.data;
    },

    sendEmail: async (payload: SendEmailPayload): Promise<void> => {
        await client.post('/gmail/send', payload);
    },

    reply: async (id: string, payload: ReplyEmailPayload): Promise<void> => {
        await client.post(`/gmail/messages/${id}/reply`, payload);
    },

    forward: async (id: string, payload: ForwardEmailPayload): Promise<void> => {
        await client.post(`/gmail/messages/${id}/forward`, payload);
    },

    delete: async (id: string): Promise<void> => {
        await client.delete(`/gmail/messages/${id}`);
    },

    searchEmails: async (query: string): Promise<EmailPreview[]> => {
        const response = await client.get<EmailPreview[]>('/gmail/search', {
            params: { q: query }
        });
        return response.data;
    }
};
