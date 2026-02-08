export interface GmailFilters {
    keyword: string;
    sender: string;
    dateRange: "all" | "1d" | "3d" | "7d" | "14d" | "1m" | "2m" | "6m" | "1y";
    dateCenter: string;
    readStatus: "all" | "unread" | "read";
    hasAttachment: boolean;
}

export function buildGmailQuery(filters: GmailFilters): string {
    const parts: string[] = [];

    // Add keyword
    if (filters.keyword.trim()) {
        parts.push(filters.keyword.trim());
    }

    // Add sender filter
    if (filters.sender.trim()) {
        parts.push(`from:${filters.sender.trim()}`);
    }

    // Add date range filter
    if (filters.dateRange !== "all") {
        const centerDate = new Date(filters.dateCenter);
        if (!isNaN(centerDate.getTime())) {
            const rangeInDays = getRangeInDays(filters.dateRange);

            const startDate = new Date(centerDate);
            startDate.setDate(startDate.getDate() - rangeInDays);

            const endDate = new Date(centerDate);
            endDate.setDate(endDate.getDate() + rangeInDays);

            const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '/');

            parts.push(`after:${formatDate(startDate)}`);
            parts.push(`before:${formatDate(endDate)}`);
        } else {
            // Fallback to relative if dateCenter is somehow invalid
            parts.push(`newer_than:${filters.dateRange}`);
        }
    }

    // Add read status filter
    if (filters.readStatus === "unread") {
        parts.push("is:unread");
    } else if (filters.readStatus === "read") {
        parts.push("is:read");
    }

    // Add attachment filter
    if (filters.hasAttachment) {
        parts.push("has:attachment");
    }

    return parts.join(" ");
}

function getRangeInDays(range: string): number {
    const unit = range.slice(-1);
    const value = parseInt(range.slice(0, -1));

    switch (unit) {
        case 'd': return value;
        case 'm': return value * 30;
        case 'y': return value * 365;
        default: return 0;
    }
}
