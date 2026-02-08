import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';


import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopilotKit publicApiKey={import.meta.env.VITE_COPILOTKIT_PUBLIC_KEY} showDevConsole={false} enableInspector={false}>
      <App />
    </CopilotKit>
  </StrictMode>,
);
