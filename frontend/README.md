# MailFlow AI Frontend

A DigiWave brutalist styled React + Vite frontend for Gmail management, ready for CopilotKit integration.

## Features
- **DigiWave Design**: Brutalist aesthetic with hard shadows, orange/black palette.
- **Mail Browsing**: Inbox, Sent, Email Detail views.
- **Compose**: Dedicated page for composing emails.
- **Search**: Basic search functionality.
- **State Management**: Zustand for predictable state.
- **Copilot Ready**: Architecture designed for easy AI integration.

## Setup

1. Make sure backend is running on `http://localhost:8000`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

## Copilot Integration
Files located in `src/copilot/`:
- `copilotContext.ts`: Defines what the AI "sees".
- `copilotActions.ts`: Defines what the AI "does".

Connect these to `useCopilotContext` and `useCopilotAction` when integrating the SDK.
