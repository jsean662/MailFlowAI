import React, { useState } from 'react';
import { useMailStore } from '../../store/mailStore';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const FilterBar: React.FC = () => {
    const {
        filters,
        setKeyword,
        applySearchAndFilters,
        clearFilters,
        searchQuery
    } = useMailStore();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = () => {
        applySearchAndFilters();
    };

    const handleClear = () => {
        clearFilters();
    };

    return (
        <div className="relative mb-6" ref={dropdownRef}>
            <div className="flex gap-2 items-center">
                <div className="relative flex-1 group">
                    <Input
                        placeholder="Search emails..."
                        value={filters.keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full"
                        inputClassName="pr-12"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 h-[calc(100%-8px)] px-2 transition-all flex items-center justify-center ${isDropdownOpen
                            ? 'bg-black text-white dark:bg-white dark:text-black border-l-2 border-black'
                            : 'text-gray-400 hover:text-black dark:text-gray-400 dark:hover:text-white border-l-2 border-transparent hover:border-black/5'
                            }`}
                        title="Show search options"
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                <Button onClick={handleSearch} variant="secondary" size="md" className="border-2 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-400 text-white font-display font-bold uppercase py-2">
                    Search
                </Button>

                {(filters.keyword || searchQuery) && (
                    <Button onClick={handleClear} variant="danger" size="md" className="border-2 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none py-2">
                        Clear
                    </Button>
                )}
            </div>

            {isDropdownOpen && (
                <div className="absolute top-[calc(100%-4px)] left-0 w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-black shadow-brutal z-50 p-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    <FilterDropdownContent onClose={() => setIsDropdownOpen(false)} />
                </div>
            )}
        </div>
    );
};

const FilterDropdownContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { filters, setFilters, applySearchAndFilters, clearFilters } = useMailStore();

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-display font-bold uppercase mb-1">From</label>
                <input
                    type="text"
                    placeholder="Sender name or email..."
                    className="w-full px-3 py-2 bg-white dark:bg-black border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-black dark:text-white"
                    value={filters.sender}
                    onChange={(e) => setFilters({ sender: e.target.value })}
                />
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-display font-bold uppercase mb-1">Date within</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-black border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-black dark:text-white"
                            value={filters.dateRange}
                            onChange={(e) => setFilters({ dateRange: e.target.value as any })}
                        >
                            <option value="all">All time</option>
                            <option value="1d">1 day</option>
                            <option value="3d">3 days</option>
                            <option value="7d">1 week</option>
                            <option value="14d">2 weeks</option>
                            <option value="1m">1 month</option>
                            <option value="2m">2 months</option>
                            <option value="6m">6 months</option>
                            <option value="1y">1 year</option>
                        </select>
                    </div>

                    <div className={filters.dateRange === 'all' ? 'opacity-30 pointer-events-none' : ''}>
                        <label className="block text-xs font-display font-bold uppercase mb-1">Of date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 bg-white dark:bg-black border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-black dark:text-white"
                            value={filters.dateCenter.replace(/\//g, '-')}
                            onChange={(e) => setFilters({ dateCenter: e.target.value.replace(/-/g, '/') })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-display font-bold uppercase mb-1">Status</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-black border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-black dark:text-white"
                            value={filters.readStatus}
                            onChange={(e) => setFilters({ readStatus: e.target.value as any })}
                        >
                            <option value="all">All</option>
                            <option value="unread">Unread only</option>
                            <option value="read">Read only</option>
                        </select>
                    </div>

                    <div className="flex items-end pb-1">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={filters.hasAttachment}
                                    onChange={(e) => setFilters({ hasAttachment: e.target.checked })}
                                />
                                <div className={`w-5 h-5 border-2 border-black transition-all flex items-center justify-center ${filters.hasAttachment ? 'bg-orange-500' : 'bg-white dark:bg-black'}`}>
                                    {filters.hasAttachment && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs font-display font-bold uppercase select-none">Has attachment</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t-2 border-black/10">
                <button
                    onClick={() => { clearFilters(); onClose(); }}
                    className="px-4 py-2 border-2 border-black font-display font-bold uppercase text-xs hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all text-black dark:text-white"
                >
                    Clear
                </button>
                <button
                    onClick={() => { applySearchAndFilters(); onClose(); }}
                    className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black border-2 border-black font-display font-bold uppercase text-xs hover:bg-orange-500 hover:text-white transition-all shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                    Apply
                </button>
            </div>
        </div>
    );
};
