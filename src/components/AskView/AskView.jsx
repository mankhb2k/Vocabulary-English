import styles from './AskView.module.css';
import { cx } from '../../lib/cx.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Plus, X } from 'lucide-react';
import { apiJson } from '../../lib/vocabulary.js';
import { PanelToggleButton } from '../PanelToggleButton/PanelToggleButton.jsx';
import { HistorySidebar } from '../HistorySidebar/HistorySidebar.jsx';
import { useSidebarOpen } from '../../hooks/useSidebarOpen.js';

const welcome = { role: 'assistant', content: 'Hi! Ask me anything about English vocabulary, grammar, pronunciation, or natural usage.' };

export function AskView({ active, onToast }) {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [panelOpen, setPanelOpen] = useSidebarOpen();
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
    if (!active) return undefined;
    let cancelled = false;
    apiJson('/api/ai/chat').then(async (payload) => {
      if (cancelled) return;
      const next = Array.isArray(payload.sessions) ? payload.sessions : [];
      setSessions(next);
      if (next.length) await loadSession(next[0].id); else await createSession();
    }).catch((error) => { if (!cancelled) onToast(error.message); });
    return () => { cancelled = true; };
  }, [active, createSession, loadSession, onToast]);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, active]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [message]);

  const submit = async (event) => {
    event.preventDefault(); const content = message.trim(); if (!content || busy) return;
    setMessage(''); setBusy(true); setContext(''); setMessages((current) => [...current, { role: 'user', content }, { role: 'assistant', content: 'Thinkingâ€¦', pending: true }]);
    try {
      const payload = await apiJson('/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: activeId, message: content }) });
      setMessages((current) => [...current.filter((item) => !item.pending), payload.message || { role: 'assistant', content: 'The AI returned an empty answer.' }]);
      if (payload.session) { setActiveId(payload.session.id); setSessions((current) => [payload.session, ...current.filter((item) => item.id !== payload.session.id)]); }
      const info = payload.context;
      if (info) setContext(info.summaryUpdated ? `Context: ${info.estimatedTokens.toLocaleString('en-US')} / ${info.maxTokens.toLocaleString('en-US')} tokens Â· summarized ${info.summarizedMessages || 0} older messages` : info.summaryUsed ? `Context: ${info.estimatedTokens.toLocaleString('en-US')} / ${info.maxTokens.toLocaleString('en-US')} tokens Â· using saved summary` : `Context: ${info.estimatedTokens.toLocaleString('en-US')} / ${info.maxTokens.toLocaleString('en-US')} tokens`);
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

  return <div className={cx(styles, `view ask-view${active ? ' is-visible' : ''}`)} id="view-ask"><section className={cx(styles, "ask-chat-shell", panelOpen && "is-panel-open")}>
    <section className={cx(styles, "simple-chat-page")}><PanelToggleButton className={cx(styles, "chat-sessions-toggle")} controls="chat-sessions" expanded={panelOpen} label={panelOpen ? "Close chat history" : "Open chat history"} onClick={() => setPanelOpen((value) => !value)}/> <div className={cx(styles, "simple-chat-messages ai-chat-messages")} id="ai-chat-messages" ref={listRef} aria-live="polite">{messages.length ? messages.map((item, index) => <div className={cx(styles, "ai-chat-message", item.role === 'user' ? "ai-chat-message-user" : "ai-chat-message-assistant")} key={`${index}-${item.role}`}>{item.content}</div>) : <div className={cx(styles, "ai-chat-message ai-chat-message-assistant")}>{welcome.content}</div>}</div><div className={cx(styles, "simple-chat-composer")}><form className={cx(styles, "ai-chat-form")} onSubmit={submit}><label className={cx(styles, "sr-only")} htmlFor="ai-chat-input">Ask the AI assistant</label><textarea ref={inputRef} id="ai-chat-input" name="message" rows="1" placeholder="Ask anything" maxLength="20000" autoComplete="off" required value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}/><button className={cx(styles, "simple-chat-send")} type="submit" aria-label="Send message" disabled={busy || !message.trim()}><ArrowUp size={19} aria-hidden="true" /></button></form><p className={cx(styles, "ai-chat-context")}>{context}</p></div></section>
    <HistorySidebar className={cx(styles, "chat-sessions")} openClassName={styles.isOpen} id="chat-sessions" label="Chat sessions" open={panelOpen}><button className={cx(styles, "new-chat-button")} type="button" onClick={createSession}><Plus size={16} aria-hidden="true" /> New chat</button><div className={cx(styles, "chat-session-list")}>{sessions.length ? sessions.map((session) => <div className={cx(styles, `chat-session-item${session.id === activeId ? ' is-active' : ''}`)} key={session.id}><button className={cx(styles, "chat-session-title")} type="button" onClick={() => { if (window.matchMedia('(max-width: 590px)').matches) setPanelOpen(false); loadSession(session.id); }}>{session.title || 'New chat'}</button><button className={cx(styles, "chat-session-delete")} type="button" aria-label={`Delete ${session.title || 'chat'}`} onClick={() => removeSession(session.id)}><X size={16} aria-hidden="true" /></button></div>) : <p className={cx(styles, "chat-session-empty")}>No chats yet.</p>}</div></HistorySidebar>
  </section></div>;
}
