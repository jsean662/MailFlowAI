
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { InboxPage } from './pages/InboxPage';
import { SentPage } from './pages/SentPage';
import { EmailPage } from './pages/EmailPage';
import { ComposePage } from './pages/ComposePage';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="sent" element={<SentPage />} />
          <Route path="email/:id" element={<EmailPage />} />
          <Route path="compose" element={<ComposePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
