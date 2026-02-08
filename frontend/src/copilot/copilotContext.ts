
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../store/uiStore";
import { useCopilotActions } from "./copilotActions";

export function useCopilotIntegration() {
    // 1. Register all AI actions
    useCopilotActions();

    // 2. Handle Navigation Requests from AI
    const { navigationTarget, setNavigationTarget } = useUIStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (navigationTarget) {
            navigate(navigationTarget);
            setNavigationTarget(null); // Reset after navigation
        }
    }, [navigationTarget, navigate, setNavigationTarget]);
}
