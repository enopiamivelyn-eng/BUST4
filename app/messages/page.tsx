'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthGate from '../components/AuthGate';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthContext';
import { useLiveDatabaseRefresh } from '../components/useLiveDatabaseRefresh';

interface BoardMessage {
  id: number;
  user_id: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  body: string;
  created_at: string;
}
interface Contact { id: string; email: string; name: string }

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadMessages = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/messages', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load messages.');
      setMessages(data.messages || []);
      setContacts(data.contacts || []);
      setIsAdmin(Boolean(data.isAdmin));
      if (data.isAdmin && !selectedUserId && data.contacts?.length) setSelectedUserId(data.contacts[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useLiveDatabaseRefresh(() => { void loadMessages(); });

  useEffect(() => { void loadMessages(); }, [loadMessages]);

  const visibleMessages = useMemo(
    () => isAdmin ? messages.filter((message) => message.user_id === selectedUserId) : messages,
    [isAdmin, messages, selectedUserId],
  );

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setError('');
    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: draft, ...(isAdmin ? { userId: selectedUserId } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send your message.');
      setDraft('');
      await loadMessages();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const selectedContact = contacts.find((contact) => contact.id === selectedUserId);

  return (
    <AuthGate>
      <div className="ds-app">
        <Navbar user={{ name: user?.name ?? 'Traveller', role: user?.role ?? 'Passenger' }} />
        <div className="ds-app-body">
          <Sidebar isAuthenticated username={user?.name ?? 'Traveller'} />
          <main className="ds-page">
            <div className="ds-mb">
              <h1 className="ds-page-title">Messages</h1>
              <p className="ds-page-sub">Send a message to the administrator and view replies here.</p>
            </div>

            <section className="ds-card" style={{ maxWidth: 850, padding: 24 }}>
              {isAdmin && <div className="ds-field">
                <label htmlFor="message-contact" className="ds-label">User conversation</label>
                <select id="message-contact" className="ds-input" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                  <option value="">Choose a user</option>
                  {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name || contact.email} ({contact.email})</option>)}
                </select>
              </div>}

              {error && <div className="ds-alert ds-alert-error" role="alert">{error}</div>}
              <div aria-live="polite" style={{ minHeight: 280, maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
                {loading ? <p className="ds-note">Loading messages…</p> : error ? null : visibleMessages.length === 0 ? <p className="ds-note">{isAdmin && !selectedUserId ? 'Choose a user to open a conversation.' : 'No messages yet. Start the conversation below.'}</p> : visibleMessages.map((message) => (
                  <article key={message.id} style={{ alignSelf: (message.sender_role === 'admin') === isAdmin ? 'flex-end' : 'flex-start', maxWidth: '82%', padding: '12px 16px', borderRadius: 14, background: (message.sender_role === 'admin') === isAdmin ? '#eaf1ff' : '#f1f5f9' }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</p>
                    <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>{message.sender_role === 'admin' ? 'Admin' : 'User'} · {new Date(message.created_at).toLocaleString()}</small>
                  </article>
                ))}
              </div>

              <form onSubmit={sendMessage} style={{ display: 'grid', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                {isAdmin && selectedContact && <p className="ds-note" style={{ margin: 0 }}>Replying to {selectedContact.name || selectedContact.email}</p>}
                <label htmlFor="message-body" className="ds-label">Message</label>
                <textarea id="message-body" className="ds-input" rows={3} maxLength={4000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write your message…" required disabled={Boolean(error) || (isAdmin && !selectedUserId)} />
                <button type="submit" className="ds-btn ds-btn-primary" disabled={Boolean(error) || sending || !draft.trim() || (isAdmin && !selectedUserId)}>{sending ? 'Sending…' : 'Send message'}</button>
              </form>
            </section>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
