import React from 'react';
import { useUIStore } from '../../store/uiStore';

export const CopilotProcessingIndicator: React.FC = () => {
    const { isCopilotProcessing } = useUIStore();

    if (!isCopilotProcessing) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-pulse duration-1000">
            <div
                className="absolute -inset-4 border-[24px] border-solid blur-xl"
                style={{
                    borderImage: 'linear-gradient(to right, #facc15, #f97316, #ef4444) 1'
                }}
            />
        </div>
    );
};
