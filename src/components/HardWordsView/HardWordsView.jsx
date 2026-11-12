import styles from './HardWordsView.module.css';
import { Button, Input, Select } from '../ui/index.js';
import { cx } from '../../lib/cx.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Mic, RotateCcw, Search, Shuffle, Square, Volume2 } from 'lucide-react';
import { apiJson } from '../../lib/vocabulary.js';

const learnedStorageKey = 'englishCardsHardWordsLearned';
const recentQuestionLimit = 50;

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [next[index], next[other]] = [next[other], next[index]];
  }
  return next;
}

function sameAnswerSet(answer, expected) {
  if (!Array.isArray(answer) || !Array.isArray(expected) || answer.length !== expected.length) return false;
  const normalize = (value) => String(value).trim().toLocaleLowerCase();
  const actualSet = new Set(answer.map(normalize));
  return actualSet.size === expected.length && expected.every((value) => actualSet.has(normalize(value)));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fillCandidate(item) {
  const target = item.word.split('/')[0].trim();
  const expression = new RegExp(`\\b${escapeRegExp(target)}\\b`, 'i');
  const example = item.examples.find((entry) => expression.test(entry.english));
  return example ? { item, sentence: example.english.replace(expression, '_____') } : null;
}

function hasAvailableRelation(item, learnedWords) {
  return ['synonyms', 'antonyms'].some((type) => item[type]?.some((word) => !learnedWords.has(String(word).trim().toLocaleLowerCase())));
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function HardWordsView({ active }) {
  const [words, setWords] = useState([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [wordsError, setWordsError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('random');
  const [randomOrder, setRandomOrder] = useState([]);
  const [group, setGroup] = useState('all');
  const [part, setPart] = useState('all');
  const [learnedFilter, setLearnedFilter] = useState('all');
  const [selectedWord, setSelectedWord] = useState(null);
  const [learned, setLearned] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(learnedStorageKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    }
    catch { return []; }
  });
  const [practice, setPractice] = useState(false);
  const [quizMode, setQuizMode] = useState(null);
  const [quizDeck, setQuizDeck] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [typedValue, setTypedValue] = useState('');
  const [score, setScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [checkingPronunciation, setCheckingPronunciation] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [pronunciationError, setPronunciationError] = useState('');
  const recorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    apiJson('/api/hard-words')
      .then((payload) => {
        if (!cancelled) {
          const items = Array.isArray(payload.items) ? payload.items : [];
          setWords(items);
          setRandomOrder(shuffle(items.map((item) => item.word.toLocaleLowerCase())));
        }
      })
      .catch((error) => {
        if (!cancelled) setWordsError(error.message || 'Could not load the hard words from D1.');
      })
      .finally(() => { if (!cancelled) setLoadingWords(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const groups = useMemo(() => [...new Set(words.map((item) => item.group))], [words]);
  const partsOfSpeech = useMemo(() => [...new Set(words.map((item) => item.partOfSpeech))], [words]);
  const learnedWords = useMemo(() => new Set(learned.map((word) => word.toLocaleLowerCase())), [learned]);
  const unlearnedWords = useMemo(() => words.filter((item) => !learnedWords.has(item.word.toLocaleLowerCase())), [words, learnedWords]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const result = words.filter((item) => (group === 'all' || item.group === group)
      && (part === 'all' || item.partOfSpeech === part)
      && (learnedFilter === 'all' || (learnedFilter === 'learned' ? learnedWords.has(item.word.toLocaleLowerCase()) : !learnedWords.has(item.word.toLocaleLowerCase())))
      && (!needle || `${item.word} ${item.meaning} ${item.group} ${item.partOfSpeech}`.toLocaleLowerCase().includes(needle)));
    if (sort === 'az') return result.sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }));
    const lookup = new Map(result.map((item) => [item.word.toLocaleLowerCase(), item]));
    const ordered = randomOrder.map((word) => lookup.get(word)).filter(Boolean);
    const included = new Set(ordered.map((item) => item.word.toLocaleLowerCase()));
    return ordered.concat(result.filter((item) => !included.has(item.word.toLocaleLowerCase())));
  }, [words, group, part, learnedFilter, learnedWords, query, sort, randomOrder]);

  const practiceWords = useMemo(() => filtered.filter((item) => !learnedWords.has(item.word.toLocaleLowerCase())), [filtered, learnedWords]);
  const fillPracticeWords = useMemo(() => practiceWords.map(fillCandidate).filter(Boolean), [practiceWords]);
  const relationPracticeWords = useMemo(() => practiceWords.filter((item) => hasAvailableRelation(item, learnedWords)), [practiceWords, learnedWords]);

  const shuffleWords = () => {
    setRandomOrder(shuffle(words.map((item) => item.word.toLocaleLowerCase())));
    setSort('random');
  };

  const startPractice = (mode = null) => {
    if (!mode) {
      setPractice(true);
      setQuizMode(null);
      setSelectedWord(null);
      return;
    }
    let candidates = practiceWords;
    if (mode === 'fill') {
      candidates = fillPracticeWords;
    }
    if (mode === 'relations') candidates = relationPracticeWords;
    if (!candidates.length) return;
    const historyKey = `englishCardsHardWordsRecent:${mode}`;
    let recent = [];
    try {
      const saved = JSON.parse(localStorage.getItem(historyKey) || '[]');
      if (Array.isArray(saved)) recent = saved;
    }
    catch { recent = []; }
    const recentSet = new Set(recent);
    const freshCandidates = shuffle(candidates.filter((candidate) => !recentSet.has((candidate.item || candidate).word)));
    const recentCandidates = shuffle(candidates.filter((candidate) => recentSet.has((candidate.item || candidate).word)));
    const questionCount = Math.min(10, candidates.length);
    const chosenCandidates = [...freshCandidates, ...recentCandidates].slice(0, questionCount);
    const deck = chosenCandidates.map((candidate) => {
      const item = candidate.item || candidate;
      if (mode === 'meaning') return { item, answer: item.word, prompt: item.meaning, options: shuffle([item.word, ...shuffle(unlearnedWords.filter((word) => word.word !== item.word)).slice(0, 3).map((word) => word.word)]) };
      if (mode === 'fill') return { item, answer: item.word, prompt: candidate.sentence, options: shuffle([item.word, ...shuffle(unlearnedWords.filter((word) => word.word !== item.word)).slice(0, 3).map((word) => word.word)]) };
      if (mode === 'pronunciation') return { item, answer: item.word, prompt: 'Say this word clearly.' };
      if (mode === 'spelling') return { item, answer: item.word, prompt: 'Listen, then type the word you hear.' };
      const availableRelations = ['synonyms', 'antonyms'].filter((type) => item[type]?.some((value) => !learnedWords.has(value.trim().toLocaleLowerCase())));
      const relationType = availableRelations[Math.floor(Math.random() * availableRelations.length)];
      const answer = [...new Set(item[relationType].map((value) => value.trim()).filter((value) => !learnedWords.has(value.toLocaleLowerCase())))];
      const correctSet = new Set(answer.map((value) => value.toLocaleLowerCase()));
      const distractors = [...new Set(shuffle(unlearnedWords.flatMap((word) => word[relationType] || []))
        .map((value) => value.trim())
        .filter((value) => value && !learnedWords.has(value.toLocaleLowerCase()) && !correctSet.has(value.toLocaleLowerCase())))].slice(0, 4);
      return {
        item,
        answer,
        relationType,
        prompt: `${item.word}: select all ${relationType === 'synonyms' ? 'synonyms' : 'antonyms'}`,
        options: shuffle([...answer, ...distractors]),
      };
    });
    const nextRecent = [...recent, ...deck.map((question) => question.item.word)].slice(-recentQuestionLimit);
    localStorage.setItem(historyKey, JSON.stringify(nextRecent));
    setQuizDeck(deck);
    setQuizIndex(0);
    setScore(0);
    setQuizAnswer('');
    setSelectedOptions([]);
    setTypedValue('');
    setPronunciationResult(null);
    setPronunciationError('');
    setQuizMode(mode);
    setPractice(true);
    setSelectedWord(null);
  };

  const nextQuestion = () => {
    const nextIndex = quizIndex + 1;
    setQuizAnswer('');
    setSelectedOptions([]);
    setTypedValue('');
    setPronunciationResult(null);
    setPronunciationError('');
    setQuizIndex(nextIndex);
  };

  const checkPronunciation = async (audioBlob) => {
    setCheckingPronunciation(true);
    setPronunciationError('');
    const form = new FormData();
    form.append('audio', audioBlob, audioBlob.type.includes('mp4') ? 'pronunciation.m4a' : 'pronunciation.webm');
    form.append('target', currentQuestion.item.word);
    try {
      const result = await apiJson('/api/pronunciation/check', { method: 'POST', body: form });
      setPronunciationResult(result);
      setQuizAnswer(result.transcript || 'checked');
      if (result.passed) setScore((current) => current + 1);
    }
    catch (error) {
      setPronunciationError(error.message || 'Could not check this recording. Please try again.');
    }
    finally {
      setCheckingPronunciation(false);
    }
  };

  const startPronunciationRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setPronunciationError('Audio recording is not supported in this browser. Try the latest version of Chrome.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        const recording = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recording.size) void checkPronunciation(recording);
        else setPronunciationError('No audio was captured. Please try recording again.');
      };
      setPronunciationError('');
      setPronunciationResult(null);
      recorder.start();
      setIsRecording(true);
    }
    catch (error) {
      setPronunciationError(error.name === 'NotAllowedError'
        ? 'Allow microphone access in your browser, then try again.'
        : 'Could not start the microphone. Check that it is connected and try again.');
    }
  };

  const stopPronunciationRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const answerQuestion = (answer) => {
    if (quizAnswer !== '') return;
    setQuizAnswer(answer);
    const question = quizDeck[quizIndex];
    const correct = quizMode === 'spelling'
      ? question?.item.word.split('/').some((value) => value.trim().toLocaleLowerCase() === answer.trim().toLocaleLowerCase())
      : quizMode === 'relations'
        ? sameAnswerSet(answer, question?.answer)
        : answer === question?.answer;
    if (correct) setScore((current) => current + 1);
  };

  const toggleOption = (option) => {
    if (quizAnswer !== '') return;
    setSelectedOptions((current) => current.includes(option)
      ? current.filter((value) => value !== option)
      : [...current, option]);
  };

  const toggleLearned = (word) => {
    const normalizedWord = word.toLocaleLowerCase();
    const next = learnedWords.has(normalizedWord)
      ? learned.filter((item) => item.toLocaleLowerCase() !== normalizedWord)
      : [...learned, word];
    setLearned(next);
    localStorage.setItem(learnedStorageKey, JSON.stringify(next));
  };

  const leavePractice = () => {
    setPractice(false);
    setQuizMode(null);
    setQuizAnswer('');
    setSelectedOptions([]);
    setPronunciationResult(null);
    setPronunciationError('');
  };

  const currentQuestion = quizDeck[quizIndex];
  const meaningExample = quizMode === 'meaning'
    ? currentQuestion?.item.examples?.find((example) => typeof example.english === 'string' && example.english.trim())
    : null;
  const questionCorrect = currentQuestion && (quizMode === 'spelling'
    ? currentQuestion.item.word.split('/').some((value) => value.trim().toLocaleLowerCase() === quizAnswer.trim().toLocaleLowerCase())
    : quizMode === 'pronunciation'
      ? pronunciationResult?.passed
    : quizMode === 'relations'
      ? sameAnswerSet(quizAnswer, currentQuestion.answer)
      : quizAnswer === currentQuestion.answer);
  const answerText = Array.isArray(currentQuestion?.answer) ? currentQuestion.answer.join(', ') : currentQuestion?.answer;
  const quizFinished = practice && quizDeck.length > 0 && quizIndex >= quizDeck.length;

  return <div className={cx(styles, `view hard-words-view${active ? ' is-visible' : ''}`)} id="view-hardwords">
    <div className={cx(styles, 'hard-words-shell')}>
      {!practice ? <>
        {!selectedWord && <>
          <header className={cx(styles, 'hard-words-heading')}>
          <div>
            <p className={cx(styles, 'eyebrow')}>PRACTICAL VOCABULARY</p>
            <h1>Words that are hard to picture</h1>
            <p>Explore abstract words, connectors, and expressions with everyday and workplace examples.</p>
          </div>
          <div className={cx(styles, 'hard-words-stats')}>
            <span><strong>{words.length.toLocaleString('en-US')}</strong> words</span>
            <span><strong>{learned.length.toLocaleString('en-US')}</strong> learned</span>
          </div>
          </header>

          <div className={cx(styles, 'hard-words-controls')}>
          <label className={cx(styles, 'hard-words-search')}>
            <span className={cx(styles, 'sr-only')}>Search words and meanings</span>
            <Search size={18} aria-hidden="true" />
            <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a word or meaning" autoComplete="off" />
          </label>
          <label className={cx(styles, 'hard-words-select-wrap')}>
            <span className={cx(styles, 'sr-only')}>Filter by word group</span>
            <Select value={group} onChange={(event) => setGroup(event.target.value)}>
              <option value="all">All groups</option>
              {groups.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </label>
          <label className={cx(styles, 'hard-words-select-wrap')}>
            <span className={cx(styles, 'sr-only')}>Filter by part of speech</span>
            <Select value={part} onChange={(event) => setPart(event.target.value)}>
              <option value="all">All word types</option>
              {partsOfSpeech.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </label>
          <label className={cx(styles, 'hard-words-select-wrap learned-filter-wrap')}>
            <span className={cx(styles, 'sr-only')}>Filter by learning status</span>
            <Select value={learnedFilter} onChange={(event) => setLearnedFilter(event.target.value)}>
              <option value="all">All learning status</option>
              <option value="unlearned">Not learned</option>
              <option value="learned">Learned</option>
            </Select>
          </label>
          <div className={cx(styles, 'hard-words-sort-tools')}>
            <label className={cx(styles, 'hard-words-sort-label')} htmlFor="hard-words-sort">Sort by</label>
            <label className={cx(styles, 'hard-words-select-wrap hard-words-sort-wrap')}>
              <span className={cx(styles, 'sr-only')}>Sort hard words</span>
              <Select id="hard-words-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="random">Random</option>
                <option value="az">A–Z</option>
              </Select>
            </label>
            <Button className={cx(styles, 'hard-words-shuffle c-button')} type="button" onClick={shuffleWords} aria-label="Shuffle words" title="Shuffle words"><Shuffle size={16} aria-hidden="true" /></Button>
          </div>
          <Button className={cx(styles, 'practice-button c-button')} type="button" onClick={() => startPractice()} disabled={!practiceWords.length}>
            <BookOpenCheck size={17} aria-hidden="true" /> Practice
          </Button>
          </div>
        </>}

        {selectedWord ? <section className={cx(styles, 'hard-word-detail')} aria-live="polite">
          <Button className={cx(styles, 'back-to-list c-button')} type="button" onClick={() => setSelectedWord(null)}><ArrowLeft size={16} aria-hidden="true" /> Back to words</Button>
          <article className={cx(styles, 'detail-card c-surface')}>
            <div className={cx(styles, 'detail-heading')}>
              <span className={cx(styles, 'word-type')}>{selectedWord.partOfSpeech}</span>
              <Button className={cx(styles, `learned-button c-button${learnedWords.has(selectedWord.word.toLocaleLowerCase()) ? ' is-learned' : ''}`)} type="button" onClick={() => toggleLearned(selectedWord.word)} aria-pressed={learnedWords.has(selectedWord.word.toLocaleLowerCase())}>
                {learnedWords.has(selectedWord.word.toLocaleLowerCase()) ? <Check size={16} aria-hidden="true" /> : <BookOpenCheck size={16} aria-hidden="true" />}
                {learnedWords.has(selectedWord.word.toLocaleLowerCase()) ? 'Unmark learned' : 'Mark as learned'}
              </Button>
              <h2>{selectedWord.word}</h2>
              {selectedWord.pronounce && <p className={cx(styles, 'word-pronunciation')}>{selectedWord.pronounce}</p>}
              <div className={cx(styles, 'detail-meaning-row')}><p lang="vi">{selectedWord.meaning}</p><Button className={cx(styles, 'speak-button c-button')} type="button" onClick={() => speak(selectedWord.word)} aria-label={`Hear ${selectedWord.word}`}><Volume2 size={18} aria-hidden="true" /></Button></div>
              <span className={cx(styles, 'detail-group')}>{selectedWord.group}</span>
            </div>
            <div className={cx(styles, 'detail-examples-wrap')}>
              <h3>Everyday and work examples <span>{selectedWord.examples.length}</span></h3>
              <ol className={cx(styles, 'detail-examples')}>
                {selectedWord.examples.map((example, index) => <li key={`${selectedWord.word}-${index}`}>
                  <div><p lang="en">{example.english}</p>{example.vietnamese && <span lang="vi">{example.vietnamese}</span>}</div>
                  <Button className={cx(styles, 'example-speak c-button')} type="button" onClick={() => speak(example.english)} aria-label={`Hear example ${index + 1}`}><Volume2 size={16} aria-hidden="true" /></Button>
                </li>)}
              </ol>
            </div>
          </article>
        </section> : <>
          <div className={cx(styles, 'results-bar')}><span>{loadingWords ? 'Loading words…' : `${filtered.length.toLocaleString('en-US')} ${filtered.length === 1 ? 'word' : 'words'}`}</span><span>Choose a word to see its meaning and examples</span></div>
          <div className={cx(styles, 'hard-words-grid')}>
            {wordsError && <div className={cx(styles, 'empty-state')} role="alert">{wordsError}</div>}
            {filtered.map((item) => {
              const isLearned = learnedWords.has(item.word.toLocaleLowerCase());
              return <div key={item.word} className={cx(styles, 'hard-word-item')}>
                <Button className={cx(styles, `hard-word-card c-button${isLearned ? ' is-learned' : ''}`)} type="button" onClick={() => setSelectedWord(item)}>
                  <span className={cx(styles, 'word-type')}>{item.partOfSpeech}</span>
                  <strong>{item.word}</strong>
                  {item.pronounce && <span className={cx(styles, 'word-pronunciation')}>{item.pronounce}</span>}
                  <span lang="vi" className={cx(styles, 'word-meaning')}>{item.meaning}</span>
                  <span className={cx(styles, 'word-group')}>{item.group}</span>
                </Button>
                {isLearned && <Button className={cx(styles, 'learned-card-unmark c-button')} type="button" onClick={() => toggleLearned(item.word)} aria-label={`Unmark ${item.word} as learned`}>Unmark</Button>}
              </div>;
            })}
            {!loadingWords && !wordsError && !filtered.length && <div className={cx(styles, 'empty-state')}>{learnedFilter === 'learned' ? 'No learned words match these filters yet.' : 'No words match your search. Try another word or group.'}</div>}
          </div>
        </>}
      </> : <section className={cx(styles, 'practice-view')} aria-live="polite">
        <Button className={cx(styles, 'back-to-list c-button')} type="button" onClick={leavePractice}><ArrowLeft size={16} aria-hidden="true" /> Back to words</Button>
        {!quizMode ? <div className={cx(styles, 'practice-card c-surface')}>
          <p className={cx(styles, 'eyebrow')}>PRACTICE</p>
          <h2>Choose a practice style</h2>
          <p>Practice only uses unlearned words that match your filters. Questions are shuffled and prioritize words you have not seen recently.</p>
          <div className={cx(styles, 'practice-mode-grid')}>
            {!practiceWords.length && <p className={cx(styles, 'no-practice-words')} role="status">No unlearned words match these filters. Choose another filter or unmark a learned word.</p>}
            <Button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('meaning')} disabled={!practiceWords.length}><strong>Meaning</strong><span>Choose the English word that matches the Vietnamese meaning.</span></Button>
            <Button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('fill')} disabled={!fillPracticeWords.length}><strong>Fill in the blank</strong><span>Complete a real sentence with the right word.</span></Button>
            <Button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('spelling')} disabled={!practiceWords.length}><strong>Listen and spell</strong><span>Listen to the pronunciation, then type the word.</span></Button>
            <Button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('pronunciation')} disabled={!practiceWords.length}><strong>Pronunciation coach</strong><span>Say each word into your microphone and get feedback from GPT-5.4 mini.</span></Button>
            <Button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('relations')} disabled={!relationPracticeWords.length}><strong>Synonyms and antonyms</strong><span>Select all matching synonyms or antonyms.</span></Button>
          </div>
        </div> : quizFinished ? <div className={cx(styles, 'practice-card c-surface')}>
          <div className={cx(styles, 'practice-complete-icon')}><Check size={27} aria-hidden="true" /></div>
          <p className={cx(styles, 'eyebrow')}>PRACTICE COMPLETE</p>
          <h2>You got {score} out of {quizDeck.length}</h2>
          <p>Keep reviewing these words to make them easier to recall.</p>
          <div className={cx(styles, 'practice-complete-actions')}><Button className={cx(styles, 'practice-button c-button')} type="button" onClick={() => startPractice(quizMode)}><RotateCcw size={16} aria-hidden="true" /> Try again</Button><Button className={cx(styles, 'secondary-button c-button')} type="button" onClick={leavePractice}>Browse words</Button></div>
        </div> : currentQuestion && <div className={cx(styles, 'practice-card c-surface')}>
          <div className={cx(styles, 'practice-topline')}><span>Question {quizIndex + 1} of {quizDeck.length}</span><span>Score {score}</span></div>
          <div className={cx(styles, 'practice-progress')}><span style={{ width: `${((quizIndex + (quizAnswer ? 1 : 0)) / quizDeck.length) * 100}%` }} /></div>
          <p className={cx(styles, 'eyebrow')}>{quizMode === 'meaning' ? 'CHOOSE THE WORD' : quizMode === 'fill' ? 'COMPLETE THE SENTENCE' : quizMode === 'spelling' ? 'LISTEN AND SPELL' : 'WORD RELATIONSHIPS'}</p>
          <h2>{quizMode === 'meaning' ? currentQuestion.prompt : quizMode === 'relations' ? currentQuestion.prompt : quizMode === 'fill' ? currentQuestion.prompt : quizMode === 'pronunciation' ? currentQuestion.item.word : currentQuestion.item.meaning}</h2>
          {quizMode === 'pronunciation' && currentQuestion.item.pronounce && <p className={cx(styles, 'practice-pronunciation')}>{currentQuestion.item.pronounce}</p>}
          {quizMode === 'meaning' && <p lang="vi" className={cx(styles, 'practice-group')}>{currentQuestion.item.group}</p>}
          {quizMode === 'relations' && <p className={cx(styles, 'practice-group')}>Select every correct answer.</p>}
          {quizMode === 'pronunciation' && <div className={cx(styles, 'pronunciation-controls')}>
            <p>Listen once, then say the word clearly. Keep your recording short.</p>
            <Button className={cx(styles, 'secondary-button c-button')} type="button" onClick={() => speak(currentQuestion.item.word)} disabled={isRecording || checkingPronunciation}><Volume2 size={17} aria-hidden="true" /> Listen to the word</Button>
            {isRecording
              ? <Button className={cx(styles, 'practice-button c-button')} type="button" onClick={stopPronunciationRecording}><Square size={16} aria-hidden="true" /> Stop and check</Button>
              : <Button className={cx(styles, 'practice-button c-button')} type="button" onClick={startPronunciationRecording} disabled={Boolean(quizAnswer) || checkingPronunciation}><Mic size={17} aria-hidden="true" /> {checkingPronunciation ? 'Checking pronunciation…' : 'Record my pronunciation'}</Button>}
            {pronunciationError && <p className={cx(styles, 'pronunciation-error')} role="alert">{pronunciationError}</p>}
            {pronunciationResult && <div className={cx(styles, `pronunciation-result${pronunciationResult.passed ? ' is-correct' : ' is-wrong'}`)} role="status">
              <strong>{pronunciationResult.score}/100 · {pronunciationResult.passed ? 'Recognized' : 'Try again'}</strong>
              <span>Heard: “{pronunciationResult.transcript}”</span>
              <span>{pronunciationResult.feedback}</span>
              <span>{pronunciationResult.tip}</span>
              <small>Score is based on speech recognition of the word, not a detailed analysis of accent or individual sounds.</small>
            </div>}
          </div>}
          {quizMode === 'spelling' && <div className={cx(styles, 'spelling-controls')}>
            <Button className={cx(styles, 'secondary-button c-button')} type="button" onClick={() => speak(currentQuestion.item.word)}><Volume2 size={17} aria-hidden="true" /> Play pronunciation</Button>
            <form onSubmit={(event) => { event.preventDefault(); if (typedValue.trim()) answerQuestion(typedValue); }}>
              <label className={cx(styles, 'sr-only')} htmlFor="spelling-answer">Type the word you hear</label>
              <Input id="spelling-answer" autoComplete="off" spellCheck="false" value={typedValue} onChange={(event) => setTypedValue(event.target.value)} disabled={Boolean(quizAnswer)} placeholder="Type the word you hear" />
              <Button className={cx(styles, 'practice-button c-button')} type="submit" disabled={Boolean(quizAnswer) || !typedValue.trim()}>Check</Button>
            </form>
          </div>}
          {(quizMode === 'meaning' || quizMode === 'fill' || quizMode === 'relations') && <div className={cx(styles, 'quiz-options')}>
            {currentQuestion.options.map((option) => {
              const isMulti = quizMode === 'relations';
              const isSelected = selectedOptions.includes(option);
              const isAnswer = quizAnswer !== '' && (isMulti ? currentQuestion.answer.includes(option) : option === currentQuestion.answer);
              const isWrong = quizAnswer !== '' && (isMulti ? isSelected && !isAnswer : quizAnswer === option && option !== currentQuestion.answer);
              const isPendingSelection = isMulti && quizAnswer === '' && isSelected;
              return <Button key={option} className={cx(styles, `quiz-option c-button${isAnswer ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}${isPendingSelection ? ' is-selected' : ''}`)} type="button" onClick={() => isMulti ? toggleOption(option) : answerQuestion(option)} disabled={quizAnswer !== ''} aria-pressed={isMulti ? isSelected : undefined}>
                <span>{option}</span>{isAnswer && <Check size={17} aria-hidden="true" />}
              </Button>;
            })}
          </div>}
          {quizMode === 'relations' && quizAnswer === '' && <Button className={cx(styles, 'practice-button continue-button c-button')} type="button" onClick={() => answerQuestion(selectedOptions)}>Check selected words</Button>}
          {quizAnswer && <div className={cx(styles, `answer-feedback${questionCorrect ? ' is-correct' : ' is-wrong'}`)} role="status">
            <strong>{questionCorrect ? 'Correct!' : `Correct answers: ${answerText}.`}</strong>
            {quizMode === 'fill' && <span lang="vi">{currentQuestion.item.meaning}</span>}
            {meaningExample && <div className={cx(styles, 'answer-example')}>
              <span className={cx(styles, 'answer-example-label')}>Example</span>
              <span lang="en">{meaningExample.english}</span>
              {meaningExample.vietnamese && <span lang="vi">{meaningExample.vietnamese}</span>}
            </div>}
          </div>}
          {quizAnswer && <Button className={cx(styles, 'practice-button continue-button c-button')} type="button" onClick={nextQuestion}>{quizIndex + 1 === quizDeck.length ? 'See your score' : 'Next question'} <ArrowRight size={16} aria-hidden="true" /></Button>}
        </div>}
      </section>}
    </div>
  </div>;
}
