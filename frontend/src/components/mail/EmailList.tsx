import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMailStore } from '../../store/mailStore';
import { EmailListItem } from './EmailListItem';
import { Loader } from '../common/Loader';
import { FilterBar } from './FilterBar';
import { Button } from '../common/Button';

interface EmailListProps {
    type: 'inbox' | 'sent';
}

export const EmailList: React.FC<EmailListProps> = ({ type }) => {
    const {
        inboxEmails,
        sentEmails,
        inboxNextPageToken,
        sentNextPageToken,
        inboxPage,
        sentPage,
        searchResults,
        isLoading,
        error,
        fetchInbox,
        fetchSent,
        nextPage,
        prevPage,
        searchQuery
    } = useMailStore();

    // Determine current page and available tokens based on type
    const emails = searchResults || (type === 'inbox' ? inboxEmails : sentEmails);
    const currentPage = type === 'inbox' ? inboxPage : sentPage;

    // For "Next" button availability:
    // If search results, we don't support pagination yet (or implemented differently).
    // If inbox/sent, we check the *current* fetch's nextPageToken.
    // However, if we are on a page that we have already visited, we might have the token in the map.
    // The store's `inboxNextPageToken` reflects the *latest* fetch. 
    // If we successfully loaded Page X, `inboxNextPageToken` is the token for Page X+1.
    // So if `inboxNextPageToken` exists, Page X+1 exists.
    const hasNextPage = searchResults ? false : (type === 'inbox' ? !!inboxNextPageToken : !!sentNextPageToken);

    useEffect(() => {
        if (!type) return;
        // Always fetch on mount if type is inbox to ensure we have fresh data and snapshot
        if (type === 'inbox' && !isLoading) fetchInbox();
        if (type === 'sent' && sentEmails.length === 0 && !isLoading) fetchSent();
    }, [type, fetchInbox, fetchSent]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleNext = () => {
        nextPage(type);
    };

    const handlePrev = () => {
        prevPage(type);
    };

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="bg-red-100 border-2 border-red-500 p-4 font-bold text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto pb-8">
            <FilterBar />

            {searchQuery && (
                <div className="mb-4 px-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Showing results for: <span className="text-black dark:text-white font-bold">"{searchQuery}"</span>
                </div>
            )}


            <div className="mt-6 space-y-4">
                {emails.length === 0 && !isLoading ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300">
                        <h3 className="font-display text-2xl text-gray-400 uppercase">No Emails Found</h3>
                    </div>
                ) : (
                    <>
                        {emails.map((email) => (
                            <EmailListItem key={email.id} email={email} />
                        ))}

                        {/* Pagination Controls */}
                        {!searchResults && (
                            <div className="flex justify-center items-center space-x-6 pt-8 pb-4">
                                <Button
                                    onClick={handlePrev}
                                    disabled={currentPage <= 1}
                                    className="px-6 py-2 bg-white text-black hover:bg-orange-500 hover:text-white disabled:hover:bg-white disabled:hover:text-black flex items-center group/btn"
                                >
                                    <ArrowLeft size={16} className="mr-2 opacity-0 -translate-x-2 transition-all group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
                                    <span>Prev</span>
                                </Button>

                                <div className="px-4 py-2 bg-black text-off-white font-display font-bold border-2 border-black transform min-w-[100px] text-center">
                                    Page {currentPage}
                                </div>

                                <Button
                                    onClick={handleNext}
                                    disabled={!hasNextPage}
                                    className="px-6 py-2 bg-white text-black hover:bg-orange-500 hover:text-white disabled:hover:bg-white disabled:hover:text-black flex items-center group/btn"
                                >
                                    <span>Next</span>
                                    <ArrowRight size={16} className="ml-2 opacity-0 translate-x-2 transition-all group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
