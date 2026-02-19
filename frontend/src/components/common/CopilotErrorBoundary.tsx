
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import App from "../../App";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class CopilotErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // console.error("CopilotKit Error Caught:", error);
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("CopilotKit Error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            // Fallback: Render App directly without CopilotKit provider
            return (
                <>
                    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-50 text-red-600 px-4 py-2 text-sm flex items-center justify-center gap-2 border-b border-red-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>AI features are currently unavailable. The application is running in fallback mode.</span>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="ml-4 underline hover:text-red-800"
                        >
                            Retry
                        </button>
                    </div>
                    <App disableCopilot={true} />
                </>
            );
        }

        return this.props.children;
    }
}
