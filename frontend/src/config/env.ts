export const env = {
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api',
    COPILOTKIT_PUBLIC_KEY: import.meta.env.VITE_COPILOTKIT_PUBLIC_KEY || '',
};
