import { useEffect, useRef, useState } from 'react';
import { peekGame } from '../lib/api.ts';
import { track } from '../lib/track.ts';
import { useStore } from '../lib/store.tsx';
import { Ico } from './icons.tsx';
import { sitePage } from './route.ts';
import { ts, type StKey } from './strings.ts';

type Check = { s: 'idle' } | { s: 'checking' } | { s: 'found'; title: string } | { s: 'no'; why: 'none' | 'done' | 'full' | 'offline' };

export function Game({ initialCode = '' }: { initialCode?: string }) {
  const { lang } = useStore();
  const t = (k: StKey, v?: Record<string, string | number>) => ts(lang, k, v);
  const [code, setCode] = useState(initialCode.replace(/\D/g, '').slice(0, 6));
  const [check, setCheck] = useState<Check>({ s: 'idle' });
  const seq = useRef(0);

  // when all 6 digits are there, find out whether a game with that code is open
  useEffect(() => {
    const mine = ++seq.current;
    if (code.length !== 6) { setCheck({ s: 'idle' }); return; }
    setCheck({ s: 'checking' });
    void peekGame(code).then((r) => {
      if (mine !== seq.current) return;
      setCheck(r.ok ? { s: 'found', title: r.title } : { s: 'no', why: r.why });
    });
  }, [code]);

  const join = () => {
    if (check.s !== 'found') return;
    track({ kind: 'game' });
    location.href = `${sitePage('play')}?code=${code}`;
  };
  const why: Record<string, StKey> = { none: 'gameNone', done: 'gameDone', full: 'gameFull', offline: 'gameOffline' };

  return (
    <div className="st-page st-gm">
      <section className="st-card st-gm-in acc-coral">
        <span className="st-tile"><Ico name="game" size={28} /></span>
        <p className="st-lead">{t('gameLead')}</p>
        <form onSubmit={(e) => { e.preventDefault(); join(); }}>
          <label htmlFor="gm-code">{t('codeLabel')}</label>
          <input id="gm-code" className="st-in st-code" inputMode="numeric" autoComplete="off" maxLength={6} value={code} autoFocus
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" />
          <div className="st-status" role="status">
            {check.s === 'checking' && <span className="st-mute">{t('gameChecking')}</span>}
            {check.s === 'found' && <span className="st-ok"><Ico name="check" size={18} />{t('gameFound', { title: check.title })}</span>}
            {check.s === 'no' && <span className="st-bad">{t(why[check.why]!)}</span>}
          </div>
          <button type="submit" className="st-main-btn orange" disabled={check.s !== 'found'}>{t('join')}</button>
        </form>
      </section>

      <section className="st-card st-how">
        <h3>{t('howTitle')}</h3>
        <ol>
          <li><span className="n">1</span>{t('how1')}</li>
          <li><span className="n">2</span>{t('how2')}</li>
          <li><span className="n">3</span>{t('how3')}</li>
        </ol>
      </section>
    </div>
  );
}
