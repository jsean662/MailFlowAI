export interface GmailFilters {
    keyword: string;
    sender: string;
    dateRange: string | "all";
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

            if (rangeInDays > 0) {
                // dateCenter is now acting as Start Date
                const startDate = new Date(centerDate);

                // End Date = Start Date + Duration
                const endDate = new Date(centerDate);
                endDate.setDate(endDate.getDate() + rangeInDays);

                const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '/');

                parts.push(`after:${formatDate(startDate)}`);
                parts.push(`before:${formatDate(endDate)}`);
            }
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

    if (isNaN(value)) return -1;

    if (isNaN(value)) return -1;

    switch (unit) {
        case 'm': return value * 30;
        case 'y': return value * 365;
        case 'd': // Fallthrough
        default: return value; // Assume days if unit is 'd' or unknown but value is present
    }
}
