import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { answerMatches } from '../../../shared/board/script.ts';
import type { Lang } from '../../../shared/types.ts';
import { TopBar } from '../../components/Chrome.tsx';
import { useStore } from '../../lib/store.tsx';
import { track } from '../../lib/track.ts';
import { TOPICS, tt, type TxKey } from './strings.ts';
import { useBoardSession, type Mode } from './useBoardSession.ts';
import '../../styles/board.css';

const MicIcon = ({ color = '#04231d' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="2.5" width="6" height="12" rx="3" fill={color} /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>
);

const Wave = ({ live, n = 22 }: { live: boolean; n?: number }) => (
  <div className={`tb-wave ${live ? 'live' : ''}`} aria-hidden="true">
    {Array.from({ length: n }, (_, i) => <i key={i} style={{ ['--h' as string]: `${8 + Math.round(24 * Math.abs(Math.sin(i * 0.9 + 1.2)) * (0.45 + 0.55 * Math.abs(Math.cos(i * 0.37))))}px`, ['--d' as string]: `${(i % 7) * 0.09}s` }} />)}
  </div>
);

function Caption({ text, word, live }: { text: string; word: number; live: boolean }) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  if (!words.length) return <div className="tb-cap" aria-live="polite" />;
  return (
    <div className="tb-cap" aria-live="polite">
      {words.map((w, i) => <span key={i} className={live && word >= 0 ? (i < word ? 'said' : i === word ? 'now' : 'next') : 'said'}>{w} </span>)}
    </div>
  );
}

const LANGS: Lang[] = ['en', 'ru', 'uz'];

export interface BoardProps {
  /** Inside the student area: no top bar of its own, it fills the space it is given. */
  embedded?: boolean;
  /** A topic to start with, as soon as the server has said whether live AI is on. */
  initialTopic?: string;
  /** The id of a prepared lesson to open instead of asking the AI. */
  initialSample?: string;
}

function BoardScreen({ mode, embedded = false, initialTopic = '', initialSample }: { mode: Mode } & BoardProps) {
  const s = useBoardSession(mode);
  const { lang, setLang, session } = useStore();
  const started = useRef(false);
  useEffect(() => {
    if (!initialTopic || started.current || !session) return; // wait for the server's answer, or the lesson would be the prepared one
    started.current = true;
    setTopic(initialTopic);
    void s.begin(initialTopic, initialSample);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic, session]);
  // React's development double-mount rebuilds the board: the lesson must then start again on the new one
  useEffect(() => () => { started.current = false; }, []);
  // inside the student area, tell it how far the lesson has got (it keeps that on this device)
  useEffect(() => {
    if (!embedded || s.phase !== 'live' || !s.total || !s.topic) return;
    const expected = s.source === 'ai' && s.playState !== 'ended' ? Math.max(s.total, 9) : s.total; // an AI lesson is still arriving
    const pct = s.playState === 'ended' ? 100 : Math.round(((s.index + 1) / expected) * 100);
    track({ kind: 'progress', topic: s.topic, id: s.sample?.id, pct });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, s.phase, s.index, s.total, s.playState, s.topic]);
  const tx = (k: TxKey) => tt(lang, k);
  const msgsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { const el = msgsRef.current; if (el) el.scrollTop = el.scrollHeight; }, [s.msgs, s.thinking]);
  const [draft, setDraft] = useState('');
  const [topic, setTopic] = useState(initialTopic);
  const [answer, setAnswer] = useState('');
  const [verdict, setVerdict] = useState<'' | 'right' | 'wrong'>('');
  const live = s.phase === 'live';
  const speaking = s.playState === 'playing';
  const statusRaw = s.thinking ? tx('thinking') : s.playState === 'paused' ? tx('paused') : s.playState === 'waiting' ? tx('waiting') : mode === 'tutor' ? tx('explaining') : tx('drawing');
  const status = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
  const mic = <MicIcon color={embedded ? '#fff' : undefined} />;
  const title = mode === 'tutor' ? tx('tutorTitle') : tx('explainerTitle');
  const chips: { label: string; send: string }[] = s.source === 'sample' && s.sample
    ? s.sample.followUps.map((f) => ({ label: f.q, send: f.q }))
    : [{ label: tx('why'), send: tx('why') }, { label: tx('another'), send: tx('another') }, { label: tx('differently'), send: tx('differently') }, { label: tx('graph'), send: tx('graph') }];
  const topics = TOPICS.filter((t) => !t.ai || s.aiOn);
  const sendDraft = () => { const q = draft.trim(); if (q) { setDraft(''); void s.ask(q); } };
  const tryOne = s.meta?.try;

  const langChips = (
    <div className="tb-langs" role="group" aria-label="Language">
      {LANGS.map((l) => <button key={l} type="button" className={`chip ${l === lang ? 'on' : ''}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
    </div>
  );

  const ask = (
    <div className="tb-input">
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendDraft(); }} placeholder={s.interim || tx('typeQ')} aria-label={tx('typeQ')} disabled={!live && mode === 'explainer'} />
      <button type="button" className="tb-send" onClick={sendDraft} aria-label={tx('send')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l16-8-6 16-3-7z" /></svg>
      </button>
    </div>
  );

  return (
    <Root className={`tb tb-${mode} ${live ? 'is-live' : 'is-start'} ${embedded ? 'tb-embed' : 'screen shell'}`} embedded={embedded}>
      {!embedded && <TopBar title={title} subtitle={s.topic || undefined} showHome right={langChips} />}
      {s.notice && <p className="tb-notice" role="status">{tx(s.notice)}</p>}
      {embedded && live && mode === 'tutor' && s.chapters.length > 1 && (
        <div className="tb-steps" role="img" aria-label={`${s.chapter + 1} / ${s.chapters.length}: ${s.chapters[s.chapter] ?? ''}`}>
          {s.chapters.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && <span className={`ln ${i <= s.chapter ? 'on' : ''}`}><i /></span>}
              <span className={`sp ${i < s.chapter ? 'done' : i === s.chapter ? 'now' : ''}`}>
                <b>{i < s.chapter ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : i + 1}</b>{c}
              </span>
            </Fragment>
          ))}
        </div>
      )}
      <div className="tb-grid">
        {mode === 'explainer' && (
          <aside className="tb-panel tb-map">
            <h2>{tx('lesson')}</h2>
            <ol>
              {s.chapters.map((c, i) => (
                <li key={i}>
                  <button type="button" className={`tb-ch ${live && i === s.chapter ? 'now' : ''} ${live && i < s.chapter ? 'done' : ''}`} onClick={() => s.seekChapter(i)} disabled={!live}>
                    <span className="n">{live && i < s.chapter ? '✓' : i + 1}</span>{c}
                  </button>
                </li>
              ))}
            </ol>
            <p className="tb-note">{tx('builtNote')}</p>
          </aside>
        )}

        <section className="tb-panel tb-board">
          {live && <div className="tb-state"><span className={`tb-dot ${speaking || s.thinking ? 'on' : ''}`} /><span>{status}</span></div>}
          {live && s.source && <span className={`tb-badge ${s.source}`}>{s.source === 'ai' ? tx('aiBadge') : tx('sampleBadge')}</span>}
          <div className="tb-canvas" ref={s.canvas} />

          {!live && (
            <div className="tb-start">
              <h1>{s.phase === 'loading' ? (s.topic || topic) : mode === 'tutor' ? tx('tutorAsk') : tx('explainerAsk')}</h1>
              {s.phase === 'loading' ? (
                <p className="tb-think"><span className="tb-spin" aria-hidden="true" />{tx('preparing')}</p>
              ) : (
                <>
                  <form onSubmit={(e) => { e.preventDefault(); void s.begin(topic); }}>
                    <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={tx('placeholder')} aria-label={tx('placeholder')} />
                    <button type="submit" className="tb-go" disabled={topic.trim().length < 2}>{tx('start')}</button>
                  </form>
                  <div className="tb-topics" aria-label={tx('tryTopics')}>
                    {topics.map((t, i) => <button key={i} type="button" className="chip" onClick={() => void s.begin(t.label[lang], t.id)}>{t.label[lang]}</button>)}
                  </div>
                  {!s.aiOn && <p className="tb-note">{tx('samplesNote')}</p>}
                </>
              )}
            </div>
          )}

          {live && <Caption text={s.caption.text} word={s.caption.word} live={speaking} />}
          {live && s.terms.length > 0 && (
            <div className="tb-terms" aria-label={tx('words')}>
              {s.terms.map((t) => (
                <div key={t.en} className="tb-term">
                  <button type="button" className="en" onClick={() => s.speakTerm(t.en, 'en')}>{t.en}</button>
                  {t.ru && <button type="button" onClick={() => s.speakTerm(t.ru!, 'ru')}>{t.ru}</button>}
                  {t.uz && <button type="button" onClick={() => s.speakTerm(t.uz!, 'uz')}>{t.uz}</button>}
                </div>
              ))}
            </div>
          )}

          {live && mode === 'explainer' && s.playState === 'ended' && !s.detour && (
            <div className="tb-end">
              <b>{tx('done')}</b>
              <button type="button" className="chip" onClick={s.replay}>{tx('replay')}</button>
              <button type="button" className="chip" onClick={s.reset}>{tx('newTopic')}</button>
            </div>
          )}

          {live && mode === 'tutor' && (
            <div className="tb-dock">
              <button type="button" className={`tb-orb ${s.listening ? 'on' : ''}`} onClick={s.toggleMic} aria-label={tx('talk')} aria-pressed={s.listening}>{mic}</button>
              <div className="tb-dock-t"><b>{s.listening ? tx('listening') : tx('talk')}</b><i>{s.interim || (s.canListen ? '' : tx('typeInstead'))}</i></div>
              <Wave live={s.listening} />
              <div className="tb-chips">{chips.map((c) => <button key={c.label} type="button" className="chip" onClick={() => void s.ask(c.send)}>{c.label}</button>)}</div>
            </div>
          )}

          {live && mode === 'explainer' && (
            <div className="tb-scrub">
              <button type="button" className="tb-play" onClick={s.toggle} aria-label={speaking ? 'Pause' : 'Play'}>
                {speaking ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5" /><rect x="14" y="4" width="5" height="16" rx="1.5" /></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>}
              </button>
              <div className="tb-track" role="slider" aria-valuemin={0} aria-valuemax={Math.max(0, s.total - 1)} aria-valuenow={s.index} tabIndex={0}
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); s.seek(Math.round(((e.clientX - r.left) / r.width) * (s.total - 1))); }}
                onKeyDown={(e) => { if (e.key === 'ArrowRight') s.seek(Math.min(s.total - 1, s.index + 1)); if (e.key === 'ArrowLeft') s.seek(Math.max(0, s.index - 1)); }}>
                <span className="f" style={{ width: `${s.total > 1 ? Math.min(100, ((s.index + (speaking ? 0.5 : 0)) / Math.max(1, s.total - 1)) * 100) : 0}%` }} />
                {s.chapterOf.map((c, i) => (i === 0 || c !== s.chapterOf[i - 1] ? <span key={i} className="k" style={{ left: `${(i / Math.max(1, s.total - 1)) * 100}%` }} /> : null))}
              </div>
              <div className="tb-speed">{[0.8, 1, 1.25].map((r) => <button key={r} type="button" className={`chip ${s.rate === r ? 'on' : ''}`} onClick={() => s.setRate(r)}>{r}×</button>)}</div>
            </div>
          )}
        </section>

        {mode === 'tutor' ? (
          <aside className="tb-panel tb-side">
            <h2>{tx('conversation')}</h2>
            {s.meta && <div className="tb-goal"><b>{tx('topic')}</b><span>{s.meta.title}</span></div>}
            <div className="tb-msgs" aria-live="polite" ref={msgsRef}>
              {s.msgs.map((m, i) => <p key={i} className={`bub ${m.role === 'student' ? 'me' : 'ai'}`}>{m.text}</p>)}
              {s.thinking && <p className="bub ai"><span className="tb-dots"><i /><i /><i /></span></p>}
            </div>
            {ask}
          </aside>
        ) : (
          <aside className="tb-panel tb-side">
            <h2>{tx('ask')}</h2>
            <div className="tb-sug">{chips.map((c) => <button key={c.label} type="button" className="chip wide" onClick={() => void s.ask(c.send)} disabled={!live}>{c.label}</button>)}</div>
            {tryOne && live && (
              <div className="tb-try">
                <b>{tx('tryOne')}</b>
                <span>{tryOne.question}</span>
                <div className="tb-tin">
                  <input value={answer} onChange={(e) => { setAnswer(e.target.value); setVerdict(''); }} onKeyDown={(e) => { if (e.key === 'Enter') setVerdict(answerMatches(answer, tryOne.answer) ? 'right' : 'wrong'); }} placeholder={tx('yourAnswer')} aria-label={tx('yourAnswer')} />
                  <button type="button" onClick={() => setVerdict(answerMatches(answer, tryOne.answer) ? 'right' : 'wrong')}>{tx('check')}</button>
                </div>
                {verdict === 'right' && <p className="ok">{tx('right')}</p>}
                {verdict === 'wrong' && <p className="no">{tx('notYet')}{tryOne.hint ? ` ${tx('hint')}: ${tryOne.hint}` : ''}</p>}
              </div>
            )}
            <div className="tb-askcard">
              <button type="button" className={`tb-orb big ${s.listening ? 'on' : ''}`} onClick={s.toggleMic} disabled={!live} aria-label={tx('talk')} aria-pressed={s.listening}>{mic}</button>
              <b>{s.listening ? tx('listening') : tx('interrupt')}</b>
              <i>{s.interim || tx('interruptSub')}</i>
              <Wave live={s.listening} n={18} />
            </div>
            {ask}
            {s.msgs.length > 0 && <div className="tb-msgs mini">{s.msgs.slice(-2).map((m, i) => <p key={i} className={`bub ${m.role === 'student' ? 'me' : 'ai'}`}>{m.text}</p>)}</div>}
          </aside>
        )}
      </div>

      {/* phone: the same controls, as a bar under the board */}
      {live && (
        <div className="tb-bar">
          <div className="tb-chips">{chips.map((c) => <button key={c.label} type="button" className="chip" onClick={() => void s.ask(c.send)}>{c.label}</button>)}</div>
          <div className="tb-barrow">
            <button type="button" className={`tb-orb ${s.listening ? 'on' : ''}`} onClick={s.toggleMic} aria-label={tx('talk')} aria-pressed={s.listening}>{mic}</button>
            {embedded && <Wave live={s.listening} n={12} />}
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendDraft(); }} placeholder={s.interim || (s.canListen ? tx('talk') : tx('typeQ'))} aria-label={tx('typeQ')} />
            <button type="button" className="tb-send" onClick={sendDraft} aria-label={tx('send')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l16-8-6 16-3-7z" /></svg>
            </button>
          </div>
        </div>
      )}
    </Root>
  );
}

/** The page of a board screen: a whole <main> in the Mini App, a plain block inside the student area. */
function Root({ className, embedded, children }: { className: string; embedded: boolean; children: ReactNode }) {
  return embedded ? <div className={className}>{children}</div> : <main className={className}>{children}</main>;
}

export const TutorScreen = (p: BoardProps) => <BoardScreen mode="tutor" {...p} />;
export const ExplainerScreen = (p: BoardProps) => <BoardScreen mode="explainer" {...p} />;
