import { useEffect, useMemo, useRef, useState } from 'react';
import { apiJson, definitionLines, exampleList } from '../lib/vocabulary.js';

const emptyForm = { word: '', definition: '', pronunciation: '', topic: 'greetings', familyRoot: '', isFamilyRoot: false, example: '' };
const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

function DefinitionPreview({ text }) {
  return <>{definitionLines(text).map((line, index) => <span className="definition-line" key={index}>{line.label && <strong>{line.label} </strong>}{line.text}</span>)}</>;
}

export function AddView({ active, editingCard, onVocabularyChanged, onSaved, onToast }) {
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [rootOptions, setRootOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [draft, setDraft] = useState(null);
  const [rootDraft, setRootDraft] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiStatus, setAiStatus] = useState({ message: '', type: '' });
  const [formStatus, setFormStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vocabulary?scope=all').then((response) => response.ok ? response.json() : null).then((payload) => {
      if (!cancelled) setRootOptions([...new Set((payload?.items || []).map((item) => item.word).filter(Boolean))].sort((a, b) => a.localeCompare(b)));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!editingCard) {
      if (active) { setForm(emptyForm); setFile(null); setDraft(null); setRootDraft(null); setFormStatus({ message: '', type: '' }); }
      return;
    }
    setForm({ word: editingCard.english || '', definition: editingCard.definition || '', pronunciation: editingCard.pronunciation || '', topic: editingCard.topic || 'other', familyRoot: editingCard.familyId || '', isFamilyRoot: Boolean(editingCard.isFamilyRoot), example: exampleList(editingCard.examples?.length ? editingCard.examples : editingCard.example).map((item, index) => `${index + 1}. ${item}`).join('\n') });
    setFile(null); setDraft(null); setRootDraft(null);
    setFormStatus({ message: `Editing ${editingCard.english}. Save to create your personal version of this card.`, type: 'success' });
  }, [editingCard, active]);

  const imageUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: key === 'isFamilyRoot' ? event.target.checked : event.target.value }));

  const generateDraft = async (event) => {
    event.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setAiBusy(true); setAiStatus({ message: 'Checking the dictionary…', type: '' }); setDraft(null); setRootDraft(null);
    try {
      const wordResponse = await fetch('/word-index.json', { cache: 'force-cache' });
      if (!wordResponse.ok) throw new Error('The vocabulary dictionary could not be loaded.');
      const words = await wordResponse.json();
      const wordSet = new Set(words.map(normalize));
      if (!wordSet.has(normalize(prompt))) {
        const suggestions = words.filter((word) => normalize(word).includes(normalize(prompt).slice(0, 3))).slice(0, 5);
        throw new Error(`This word was not found in the dictionary.${suggestions.length ? ` Did you mean: ${suggestions.join(', ')}?` : ''}`);
      }
      setAiStatus({ message: 'Generating a vocabulary draft…', type: '' });
      const payload = await apiJson('/api/ai/vocabulary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) });
      setDraft(payload.item); setAiStatus({ message: 'Draft ready. Review it, then use it in the vocabulary form.', type: 'success' });
    } catch (error) { setAiStatus({ message: error.message, type: 'error' }); }
    finally { setAiBusy(false); }
  };

  const generateRoot = async () => {
    if (!draft?.rootSuggestion) return;
    setAiBusy(true); setAiStatus({ message: `Generating the root card “${draft.rootSuggestion}”…`, type: '' });
    try {
      const payload = await apiJson('/api/ai/vocabulary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: draft.rootSuggestion }) });
      setRootDraft(payload.item); setAiStatus({ message: 'Root draft ready. Review it, then save the root word.', type: 'success' });
    } catch (error) { setAiStatus({ message: error.message, type: 'error' }); }
    finally { setAiBusy(false); }
  };

  const saveRoot = async () => {
    if (!rootDraft) return;
    const data = new FormData();
    data.append('word', rootDraft.word || ''); data.append('definition', rootDraft.definition || ''); data.append('pronunciation', rootDraft.pronunciation || ''); data.append('topic', rootDraft.topic || 'other'); data.append('example', exampleList(rootDraft.examples?.length ? rootDraft.examples : rootDraft.example).join('\n')); data.append('isFamilyRoot', 'true');
    setAiBusy(true);
    try {
      const payload = await apiJson('/api/vocabulary', { method: 'POST', body: data });
      setDraft((current) => ({ ...current, familyRoot: payload.item.word || rootDraft.word, rootSuggestion: '' })); setRootDraft(null); setAiStatus({ message: 'Root saved. Apply the vocabulary draft and save it next.', type: 'success' });
      setRootOptions((current) => [...new Set([...current, payload.item.word || rootDraft.word])].sort((a, b) => a.localeCompare(b)));
      onVocabularyChanged();
    } catch (error) { setAiStatus({ message: error.message, type: 'error' }); }
    finally { setAiBusy(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (file && file.size > 5 * 1024 * 1024) { setFormStatus({ message: 'The image must be smaller than 5MB.', type: 'error' }); return; }
    const isEditing = Boolean(editingCard);
    const formData = new FormData(formRef.current);
    if (file) formData.set('image', file);
    if (editingCard?.id) formData.append('id', editingCard.id);
    if (isEditing) { formData.append('replaceExisting', 'true'); formData.append('existingWord', editingCard.english || ''); }
    setSaving(true); setFormStatus({ message: isEditing ? 'Updating the vocabulary…' : file ? 'Uploading the image and saving the vocabulary…' : 'Saving the vocabulary with the fallback image…', type: '' });
    try {
      await apiJson('/api/vocabulary', { method: editingCard?.id ? 'PUT' : 'POST', body: formData });
      setForm(emptyForm); setFile(null); if (fileRef.current) fileRef.current.value = ''; setDraft(null); setRootDraft(null); setAiPrompt(''); setFormStatus({ message: isEditing ? 'Vocabulary updated successfully.' : 'New vocabulary saved successfully.', type: 'success' });
      onSaved();
    } catch (error) { setFormStatus({ message: error.message, type: 'error' }); }
    finally { setSaving(false); }
  };

  const applyDraft = () => setForm((current) => ({ ...current, word: draft.word || '', definition: draft.definition || '', pronunciation: draft.pronunciation || '', topic: draft.topic || 'other', familyRoot: draft.familyRoot || '', isFamilyRoot: Boolean(draft.isFamilyRoot), example: exampleList(draft.examples?.length ? draft.examples : draft.example).map((item, index) => `${index + 1}. ${item}`).join('\n') }));
  const needsRoot = Boolean(draft?.rootSuggestion && !draft.familyRoot && normalize(draft.rootSuggestion) !== normalize(draft.word));

  return <div className={`view${active ? ' is-visible' : ''}`} id="view-add">
    <section className="page-heading"><p className="eyebrow">YOUR VOCABULARY</p><h1>Add a new vocabulary item</h1><p>Save a word, phrase, its English definition, and a memorable image to make learning personal.</p></section>
    <section className="ai-assistant c-surface" id="ai-assistant"><div className="ai-assistant-heading"><div><span className="section-label">AI ASSISTANT</span><h2>Build a vocabulary card</h2><p>Ask your configured AI to prepare a structured English vocabulary draft.</p></div><span className="ai-spark" aria-hidden="true">✦</span></div>
      <form className="ai-form" onSubmit={generateDraft}><label className="form-field"><span>Word or vocabulary item</span><input value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} type="text" placeholder="For example: sustainable" maxLength="120" required/></label><button className="secondary-button c-button" type="submit" disabled={aiBusy}>Generate draft <span>→</span></button></form>
      <p className={`ai-status${aiStatus.type ? ` is-${aiStatus.type}` : ''}`} role="status">{aiStatus.message}</p>
      {draft && <div className="ai-draft-preview"><div className="ai-draft-heading"><span className="section-label">AI DRAFT</span><button className="secondary-button c-button" type="button" onClick={applyDraft}>Use this draft</button></div><h3>{draft.word}</h3><p><DefinitionPreview text={draft.definition}/></p><div className="ai-draft-meta"><span>{draft.pronunciation || 'Pronunciation not provided'}</span><span>{draft.topic || 'other'}</span><span>{draft.isFamilyRoot ? `Family root card: ${draft.word}` : draft.familyRoot ? `Family root: ${draft.familyRoot}` : draft.rootSuggestion ? `Root suggestion: ${draft.rootSuggestion}` : 'No confident root suggestion'}</span></div><p className="ai-draft-example">“{draft.example}”</p>
        {needsRoot && <div className="ai-family-actions"><p className="ai-family-status">Root card “{draft.rootSuggestion}” is not in your vocabulary yet.</p><div className="ai-family-buttons"><button className="secondary-button c-button" type="button" onClick={generateRoot} disabled={aiBusy}>Generate root card</button></div></div>}
        {rootDraft && <div className="ai-root-draft"><span className="section-label">ROOT DRAFT</span><h4>{rootDraft.word}</h4><p><DefinitionPreview text={rootDraft.definition}/></p><div className="ai-root-draft-meta"><span>{rootDraft.pronunciation}</span><span>{rootDraft.topic}</span></div><p className="ai-root-draft-example">“{rootDraft.example}”</p><button className="primary-button c-button" type="button" onClick={saveRoot} disabled={aiBusy}>Save root word <span>→</span></button></div>}
      </div>}
    </section>
    <section className="vocab-form-layout"><form className="vocab-form c-surface" ref={formRef} onSubmit={submit}><div className="form-heading"><div><span className="section-label">VOCABULARY DETAILS</span><h2>{editingCard ? 'Edit vocabulary card' : 'Create a new card'}</h2></div><span className="form-required">* required</span></div>
      <div className="form-grid">
        <label className="form-field form-field-wide"><span>Word or vocabulary item <b>*</b></span><input name="word" value={form.word} onChange={update('word')} type="text" placeholder="For example: resilient or take a break" required maxLength="120"/><small>Words, phrasal verbs, and useful vocabulary items are welcome.</small></label>
        <label className="form-field form-field-wide"><span>English definition <b>*</b></span><textarea name="definition" value={form.definition} onChange={update('definition')} rows="3" placeholder="Able to recover quickly from difficulties." required maxLength="500"/></label>
        <label className="form-field"><span>Pronunciation</span><input name="pronunciation" value={form.pronunciation} onChange={update('pronunciation')} type="text" placeholder="/rɪˈzɪliənt/" maxLength="120"/></label>
        <label className="form-field"><span>Topic</span><select name="topic" value={form.topic} onChange={update('topic')}><option value="greetings">Conversation</option><option value="work">Work</option><option value="travel">Travel</option><option value="other">Other</option></select></label>
        <label className="form-field form-field-wide"><span>Word family root</span><input name="familyRoot" value={form.familyRoot} onChange={update('familyRoot')} list="family-root-options" placeholder="For example: help" maxLength="120"/><small>Optional. Link this item to an existing root. AI suggestions appear above when available.</small><div className="root-toggle"><input name="isFamilyRoot" checked={form.isFamilyRoot} onChange={update('isFamilyRoot')} type="checkbox" value="true"/><span>Use this card as a word family root</span></div><datalist id="family-root-options">{rootOptions.map((word) => <option key={word} value={word}/>)}</datalist></label>
        <label className="form-field form-field-wide"><span>Example sentences <b>*</b></span><textarea name="example" value={form.example} onChange={update('example')} rows="5" placeholder="Write at least 3 sentences, one per line." required maxLength="1500"/><small>Write at least three natural sentences, one per line.</small></label>
      </div>
      <label className="image-upload" htmlFor="vocab-image"><span className="upload-icon">↑</span><span><strong>Choose an image <b>(optional)</b></strong><small>PNG, JPG or WEBP · max 5MB · Falls back to placeholder-1.png</small></span><input ref={fileRef} id="vocab-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)}/></label>
      {file && <div className="image-preview"><img src={imageUrl} alt="Selected image preview"/><span title={file.name}>{file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB</span><button type="button" aria-label="Remove selected image" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>×</button></div>}
      <div className="form-actions"><span className={`form-status${formStatus.type ? ` is-${formStatus.type}` : ''}`} role="status">{formStatus.message}</span><button className="primary-button c-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editingCard ? 'Update vocabulary' : 'Save vocabulary'} <span>→</span></button></div>
    </form></section>
  </div>;
}
