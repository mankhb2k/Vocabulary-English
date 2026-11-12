import styles from './HardWordsView.module.css';
import { cx } from '../../lib/cx.js';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, ChevronDown, RotateCcw, Search, Volume2 } from 'lucide-react';
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
  const [group, setGroup] = useState('all');
  const [part, setPart] = useState('all');
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

  useEffect(() => {
    let cancelled = false;
    apiJson('/api/hard-words')
      .then((payload) => {
        if (!cancelled) setWords(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch((error) => {
        if (!cancelled) setWordsError(error.message || 'Could not load the hard words from D1.');
      })
      .finally(() => { if (!cancelled) setLoadingWords(false); });
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => [...new Set(words.map((item) => item.group))], [words]);
  const partsOfSpeech = useMemo(() => [...new Set(words.map((item) => item.partOfSpeech))], [words]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return words.filter((item) => (group === 'all' || item.group === group)
      && (part === 'all' || item.partOfSpeech === part)
      && (!needle || `${item.word} ${item.meaning} ${item.group} ${item.partOfSpeech}`.toLocaleLowerCase().includes(needle)));
  }, [words, group, part, query]);

  const startPractice = (mode = null) => {
    if (!mode) {
      setPractice(true);
      setQuizMode(null);
      setSelectedWord(null);
      return;
    }
    let candidates = filtered;
    if (mode === 'fill') {
      candidates = filtered.map(fillCandidate).filter(Boolean);
    }
    if (mode === 'relations') candidates = filtered.filter((item) => item.synonyms?.length || item.antonyms?.length);
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
      if (mode === 'meaning') return { item, answer: item.word, prompt: item.meaning, options: shuffle([item.word, ...shuffle(words.filter((word) => word.word !== item.word)).slice(0, 3).map((word) => word.word)]) };
      if (mode === 'fill') return { item, answer: item.word, prompt: candidate.sentence, options: shuffle([item.word, ...shuffle(words.filter((word) => word.word !== item.word)).slice(0, 3).map((word) => word.word)]) };
      if (mode === 'spelling') return { item, answer: item.word, prompt: 'Listen, then type the word you hear.' };
      const relationType = Math.random() < 0.5 && item.synonyms?.length ? 'synonyms' : item.antonyms?.length ? 'antonyms' : 'synonyms';
      const answer = [...new Set(item[relationType].map((value) => value.trim()))];
      const correctSet = new Set(answer.map((value) => value.toLocaleLowerCase()));
      const distractors = [...new Set(shuffle(words.flatMap((word) => word[relationType] || []))
        .map((value) => value.trim())
        .filter((value) => value && !correctSet.has(value.toLocaleLowerCase())))].slice(0, 4);
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
    setQuizMode(mode);
    setPractice(true);
    setSelectedWord(null);
  };

  const nextQuestion = () => {
    const nextIndex = quizIndex + 1;
    setQuizAnswer('');
    setSelectedOptions([]);
    setTypedValue('');
    setQuizIndex(nextIndex);
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
    const next = learned.includes(word) ? learned.filter((item) => item !== word) : [...learned, word];
    setLearned(next);
    localStorage.setItem(learnedStorageKey, JSON.stringify(next));
  };

  const leavePractice = () => {
    setPractice(false);
    setQuizMode(null);
    setQuizAnswer('');
    setSelectedOptions([]);
  };

  const currentQuestion = quizDeck[quizIndex];
  const questionCorrect = currentQuestion && (quizMode === 'spelling'
    ? currentQuestion.item.word.split('/').some((value) => value.trim().toLocaleLowerCase() === quizAnswer.trim().toLocaleLowerCase())
    : quizMode === 'relations'
      ? sameAnswerSet(quizAnswer, currentQuestion.answer)
      : quizAnswer === currentQuestion.answer);
  const answerText = Array.isArray(currentQuestion?.answer) ? currentQuestion.answer.join(', ') : currentQuestion?.answer;
  const quizFinished = practice && quizDeck.length > 0 && quizIndex >= quizDeck.length;

  return <div className={cx(styles, `view hard-words-view${active ? ' is-visible' : ''}`)} id="view-hardwords">
    <div className={cx(styles, 'hard-words-shell')}>
      {!practice ? <>
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
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a word or meaning" autoComplete="off" />
          </label>
          <label className={cx(styles, 'hard-words-select-wrap')}>
            <span className={cx(styles, 'sr-only')}>Filter by word group</span>
            <select value={group} onChange={(event) => setGroup(event.target.value)}>
              <option value="all">All groups</option>
              {groups.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
          <label className={cx(styles, 'hard-words-select-wrap')}>
            <span className={cx(styles, 'sr-only')}>Filter by part of speech</span>
            <select value={part} onChange={(event) => setPart(event.target.value)}>
              <option value="all">All word types</option>
              {partsOfSpeech.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
          <button className={cx(styles, 'practice-button c-button')} type="button" onClick={() => startPractice()} disabled={!filtered.length}>
            <BookOpenCheck size={17} aria-hidden="true" /> Practice
          </button>
        </div>

        {selectedWord ? <section className={cx(styles, 'hard-word-detail')} aria-live="polite">
          <button className={cx(styles, 'back-to-list c-button')} type="button" onClick={() => setSelectedWord(null)}><ArrowLeft size={16} aria-hidden="true" /> Back to words</button>
          <article className={cx(styles, 'detail-card c-surface')}>
            <div className={cx(styles, 'detail-heading')}>
              <span className={cx(styles, 'word-type')}>{selectedWord.partOfSpeech}</span>
              <button className={cx(styles, `learned-button c-button${learned.includes(selectedWord.word) ? ' is-learned' : ''}`)} type="button" onClick={() => toggleLearned(selectedWord.word)} aria-pressed={learned.includes(selectedWord.word)}>
                {learned.includes(selectedWord.word) ? <Check size={16} aria-hidden="true" /> : <BookOpenCheck size={16} aria-hidden="true" />}
                {learned.includes(selectedWord.word) ? 'Learned' : 'Mark as learned'}
              </button>
              <h2>{selectedWord.word}</h2>
              <div className={cx(styles, 'detail-meaning-row')}><p lang="vi">{selectedWord.meaning}</p><button className={cx(styles, 'speak-button c-button')} type="button" onClick={() => speak(selectedWord.word)} aria-label={`Hear ${selectedWord.word}`}><Volume2 size={18} aria-hidden="true" /></button></div>
              <span className={cx(styles, 'detail-group')}>{selectedWord.group}</span>
            </div>
            <div className={cx(styles, 'detail-examples-wrap')}>
              <h3>Everyday and work examples <span>{selectedWord.examples.length}</span></h3>
              <ol className={cx(styles, 'detail-examples')}>
                {selectedWord.examples.map((example, index) => <li key={`${selectedWord.word}-${index}`}>
                  <div><p lang="en">{example.english}</p>{example.vietnamese && <span lang="vi">{example.vietnamese}</span>}</div>
                  <button className={cx(styles, 'example-speak c-button')} type="button" onClick={() => speak(example.english)} aria-label={`Hear example ${index + 1}`}><Volume2 size={16} aria-hidden="true" /></button>
                </li>)}
              </ol>
            </div>
          </article>
        </section> : <>
          <div className={cx(styles, 'results-bar')}><span>{loadingWords ? 'Loading words…' : `${filtered.length.toLocaleString('en-US')} ${filtered.length === 1 ? 'word' : 'words'}`}</span><span>Choose a word to see its meaning and examples</span></div>
          <div className={cx(styles, 'hard-words-grid')}>
            {wordsError && <div className={cx(styles, 'empty-state')} role="alert">{wordsError}</div>}
            {filtered.map((item) => <button key={item.word} className={cx(styles, 'hard-word-card c-button')} type="button" onClick={() => setSelectedWord(item)}>
              <span className={cx(styles, 'word-type')}>{item.partOfSpeech}</span>
              {learned.includes(item.word) && <Check className={cx(styles, 'learned-check')} size={17} aria-label="Learned" />}
              <strong>{item.word}</strong>
              <span lang="vi" className={cx(styles, 'word-meaning')}>{item.meaning}</span>
              <span className={cx(styles, 'word-group')}>{item.group}</span>
            </button>)}
            {!loadingWords && !wordsError && !filtered.length && <div className={cx(styles, 'empty-state')}>No words match your search. Try another word or group.</div>}
          </div>
        </>}
      </> : <section className={cx(styles, 'practice-view')} aria-live="polite">
        <button className={cx(styles, 'back-to-list c-button')} type="button" onClick={leavePractice}><ArrowLeft size={16} aria-hidden="true" /> Back to words</button>
        {!quizMode ? <div className={cx(styles, 'practice-card c-surface')}>
          <p className={cx(styles, 'eyebrow')}>PRACTICE</p>
          <h2>Choose a practice style</h2>
          <p>Pick a short set based on the words currently shown by your filters. Questions are shuffled and prioritize words you have not seen recently.</p>
          <div className={cx(styles, 'practice-mode-grid')}>
            <button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('meaning')}><strong>Meaning</strong><span>Choose the English word that matches the Vietnamese meaning.</span></button>
            <button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('fill')} disabled={!filtered.some((item) => fillCandidate(item))}><strong>Fill in the blank</strong><span>Complete a real sentence with the right word.</span></button>
            <button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('spelling')}><strong>Listen and spell</strong><span>Listen to the pronunciation, then type the word.</span></button>
            <button type="button" className={cx(styles, 'practice-mode-card c-button')} onClick={() => startPractice('relations')} disabled={!filtered.some((item) => item.synonyms?.length || item.antonyms?.length)}><strong>Synonyms and antonyms</strong><span>Select all matching synonyms or antonyms.</span></button>
          </div>
        </div> : quizFinished ? <div className={cx(styles, 'practice-card c-surface')}>
          <div className={cx(styles, 'practice-complete-icon')}><Check size={27} aria-hidden="true" /></div>
          <p className={cx(styles, 'eyebrow')}>PRACTICE COMPLETE</p>
          <h2>You got {score} out of {quizDeck.length}</h2>
          <p>Keep reviewing these words to make them easier to recall.</p>
          <div className={cx(styles, 'practice-complete-actions')}><button className={cx(styles, 'practice-button c-button')} type="button" onClick={() => startPractice(quizMode)}><RotateCcw size={16} aria-hidden="true" /> Try again</button><button className={cx(styles, 'secondary-button c-button')} type="button" onClick={leavePractice}>Browse words</button></div>
        </div> : currentQuestion && <div className={cx(styles, 'practice-card c-surface')}>
          <div className={cx(styles, 'practice-topline')}><span>Question {quizIndex + 1} of {quizDeck.length}</span><span>Score {score}</span></div>
          <div className={cx(styles, 'practice-progress')}><span style={{ width: `${((quizIndex + (quizAnswer ? 1 : 0)) / quizDeck.length) * 100}%` }} /></div>
          <p className={cx(styles, 'eyebrow')}>{quizMode === 'meaning' ? 'CHOOSE THE WORD' : quizMode === 'fill' ? 'COMPLETE THE SENTENCE' : quizMode === 'spelling' ? 'LISTEN AND SPELL' : 'WORD RELATIONSHIPS'}</p>
          <h2>{quizMode === 'meaning' ? currentQuestion.prompt : quizMode === 'relations' ? currentQuestion.prompt : quizMode === 'fill' ? currentQuestion.prompt : currentQuestion.item.meaning}</h2>
          {quizMode === 'meaning' && <p lang="vi" className={cx(styles, 'practice-group')}>{currentQuestion.item.group}</p>}
          {quizMode === 'relations' && <p className={cx(styles, 'practice-group')}>Select every correct answer.</p>}
          {quizMode === 'spelling' && <div className={cx(styles, 'spelling-controls')}>
            <button className={cx(styles, 'secondary-button c-button')} type="button" onClick={() => speak(currentQuestion.item.word)}><Volume2 size={17} aria-hidden="true" /> Play pronunciation</button>
            <form onSubmit={(event) => { event.preventDefault(); if (typedValue.trim()) answerQuestion(typedValue); }}>
              <label className={cx(styles, 'sr-only')} htmlFor="spelling-answer">Type the word you hear</label>
              <input id="spelling-answer" autoComplete="off" spellCheck="false" value={typedValue} onChange={(event) => setTypedValue(event.target.value)} disabled={Boolean(quizAnswer)} placeholder="Type the word you hear" />
              <button className={cx(styles, 'practice-button c-button')} type="submit" disabled={Boolean(quizAnswer) || !typedValue.trim()}>Check</button>
            </form>
          </div>}
          {(quizMode === 'meaning' || quizMode === 'fill' || quizMode === 'relations') && <div className={cx(styles, 'quiz-options')}>
            {currentQuestion.options.map((option) => {
              const isMulti = quizMode === 'relations';
              const isSelected = selectedOptions.includes(option);
              const isAnswer = quizAnswer !== '' && (isMulti ? currentQuestion.answer.includes(option) : option === currentQuestion.answer);
              const isWrong = quizAnswer !== '' && (isMulti ? isSelected && !isAnswer : quizAnswer === option && option !== currentQuestion.answer);
              const isPendingSelection = isMulti && quizAnswer === '' && isSelected;
              return <button key={option} className={cx(styles, `quiz-option c-button${isAnswer ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}${isPendingSelection ? ' is-selected' : ''}`)} type="button" onClick={() => isMulti ? toggleOption(option) : answerQuestion(option)} disabled={quizAnswer !== ''} aria-pressed={isMulti ? isSelected : undefined}>
                <span>{option}</span>{isAnswer && <Check size={17} aria-hidden="true" />}
              </button>;
            })}
          </div>}
          {quizMode === 'relations' && quizAnswer === '' && <button className={cx(styles, 'practice-button continue-button c-button')} type="button" onClick={() => answerQuestion(selectedOptions)}>Check selected words</button>}
          {quizAnswer && <div className={cx(styles, `answer-feedback${questionCorrect ? ' is-correct' : ' is-wrong'}`)} role="status">
            <strong>{questionCorrect ? 'Correct!' : `Correct answers: ${answerText}.`}</strong>
            {quizMode === 'fill' && <span lang="vi">{currentQuestion.item.meaning}</span>}
            {currentQuestion.item.examples[0]?.vietnamese && <span lang="vi">{currentQuestion.item.examples[0].vietnamese}</span>}
          </div>}
          {quizAnswer && <button className={cx(styles, 'practice-button continue-button c-button')} type="button" onClick={nextQuestion}>{quizIndex + 1 === quizDeck.length ? 'See your score' : 'Next question'} <ArrowRight size={16} aria-hidden="true" /></button>}
        </div>}
      </section>}
    </div>
  </div>;
}
