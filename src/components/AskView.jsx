import { useCallback, useEffect, useRef, useState } from 'react';
import { apiJson } from '../lib/vocabulary.js';

const welcome = { role: 'assistant', content: 'Hi! Ask me anything about English vocabulary, grammar, pronunciation, or natural usage.' };

export function AskView({ active, onToast }) {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [context, setContext] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const loadSession = useCallback(async (id) => {
    if (!id) return;
    try {
      const payload = await apiJson(`/api/ai/chat?sessionId=${encodeURIComponent(id)}`);
      setActiveId(payload.session.id); setMessages(Array.isArray(payload.messages) ? payload.messages : []); setContext('');
    } catch (error) { onToast(error.message); }
  }, [onToast]);

  const createSession = useCallback(async () => {
    try {
      const payload = await apiJson('/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create' }) });
      setSessions((current) => [payload.session, ...current.filter((item) => item.id !== payload.session.id)]); setActiveId(payload.session.id); setMessages([]); setContext(''); inputRef.current?.focus();
    } catch (error) { onToast(error.message); }
  }, [onToast]);

  useEffect(() => {
    let cancelled = false;
    apiJson('/api/ai/chat').then(async (payload) => {
      if (cancelled) return;
      const next = Array.isArray(payload.sessions) ? payload.sessions : [];
      setSessions(next);
      if (next.length) await loadSession(next[0].id); else await createSession();
    }).catch((error) => { if (!cancelled) onToast(error.message); });
    return () => { cancelled = true; };
  }, [createSession, loadSession, onToast]);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, active]);

  const submit = async (event) => {
    event.preventDefault(); const content = message.trim(); if (!content || busy) return;
    setMessage(''); setBusy(true); setContext(''); setMessages((current) => [...current, { role: 'user', content }, { role: 'assistant', content: 'Thinking…', pending: true }]);
    try {
      const payload = await apiJson('/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: activeId, message: content }) });
      setMessages((current) => [...current.filter((item) => !item.pending), payload.message || { role: 'assistant', content: 'The AI returned an empty answer.' }]);
      if (payload.session) { setActiveId(payload.session.id); setSessions((current) => [payload.session, ...current.filter((item) => item.id !== payload.session.id)]); }
      const info = payload.context;
      if (info) setContext(info.summaryUpdated ? `Context: ${info.estimatedTokens.toLocaleString('en-US')} / ${info.maxTokens.toLocaleString('en-US')} tokens · summarized ${info.summarizedMessages || 0} older messages` : info.summaryUsed ? `Context: ${info.estimatedTokens.toLocaleString('en-US')} / ${info.maxTokens.toLocaleString('en-US')} tokens · using saved summary` : `Context: ${info.estimatedTokens.toLocaleString('en-US')} / ${info.maxTokens.toLocaleString('en-US')} tokens`);
    } catch (error) { setMessages((current) => current.filter((item) => !item.pending)); onToast(error.message); }
    finally { setBusy(false); inputRef.current?.focus(); }
  };

  const removeSession = async (id) => {
    try {
      await apiJson('/api/ai/chat', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: id }) });
      const remaining = sessions.filter((item) => item.id !== id); setSessions(remaining);
      if (activeId === id) { setActiveId(null); setMessages([]); if (remaining.length) await loadSession(remaining[0].id); else await createSession(); }
    } catch (error) { onToast(error.message); }
  };

  return <div className={`view${active ? ' is-visible' : ''}`} id="view-ask"><section className="ask-chat-shell">
    <aside className={`chat-sessions${panelOpen ? ' is-open' : ''}`} id="chat-sessions" aria-label="Chat sessions"><button className="new-chat-button" type="button" onClick={createSession}>+ New chat</button><div className="chat-session-list">{sessions.length ? sessions.map((session) => <div className={`chat-session-item${session.id === activeId ? ' is-active' : ''}`} key={session.id}><button className="chat-session-title" type="button" onClick={() => { setPanelOpen(false); loadSession(session.id); }}>{session.title || 'New chat'}</button><button className="chat-session-delete" type="button" aria-label={`Delete ${session.title || 'chat'}`} onClick={() => removeSession(session.id)}>×</button></div>) : <p className="chat-session-empty">No chats yet.</p>}</div></aside>
    <section className="simple-chat-page"><button className="chat-sessions-toggle" type="button" aria-label="Open chat history" aria-controls="chat-sessions" aria-expanded={panelOpen} onClick={() => setPanelOpen((value) => !value)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.5h14M5 12h14M5 16.5h9"/></svg></button><div className="simple-chat-messages ai-chat-messages" id="ai-chat-messages" ref={listRef} aria-live="polite">{messages.length ? messages.map((item, index) => <div className={`ai-chat-message ai-chat-message-${item.role}`} key={`${index}-${item.role}`}>{item.content}</div>) : <div className="ai-chat-message ai-chat-message-assistant">{welcome.content}</div>}</div><div className="simple-chat-composer"><form className="ai-chat-form" onSubmit={submit}><label className="sr-only" htmlFor="ai-chat-input">Ask the AI assistant</label><input ref={inputRef} id="ai-chat-input" name="message" type="text" placeholder="Ask anything" maxLength="20000" autoComplete="off" required value={message} onChange={(event) => setMessage(event.target.value)}/><button className="simple-chat-send" type="submit" aria-label="Send message" disabled={busy || !message.trim()}>↑</button></form><p className="ai-chat-context">{context}</p></div></section>
  </section></div>;
}
