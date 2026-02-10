export interface EmailPreview {
    id: string;
    sender: string;
    subject: string;
    snippet: string;
    date: string;
    unread: boolean;
}

export interface EmailDetail extends EmailPreview {
    body: string;
}

export interface SendEmailPayload {
    to: string[];
    subject: string;
    body: string;
}

export interface PaginatedResponse {
    messages: EmailPreview[];
    nextPageToken: string | null;
}

export interface ReplyEmailPayload {
    body: string;
}

export interface ForwardEmailPayload {
    to: string[];
    body: string;
}
