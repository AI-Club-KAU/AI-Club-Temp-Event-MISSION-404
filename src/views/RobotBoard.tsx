import { useEffect, useRef, useState } from 'react';
import { OUTCOME_TEXT, simulate, type Cell, type Outcome, type RobotData, type RobotReveal } from './robot';

export type RobotPlay = { moves: string[]; reveal: RobotReveal; onDone: () => void };

const STEP_MS = 450;
const key = (c: Cell) => `${c[0]}-${c[1]}`;

/** شبكة الروبوت: ثابتة قبل الإجابة، وبعد التأكيد يتحرك الروبوت فعليًا حسب الأوامر المختارة */
export function RobotBoard({ d, play }: { d: RobotData; play?: RobotPlay | null }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ path: Cell[]; outcome: Outcome; at: Cell | null } | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!play) return;
    const sim = simulate(play.moves, d, play.reveal);
    setResult(sim); setStep(0); setEnded(false);
    // نرجع للشبكة أولًا ثم نبدأ الحركة
    boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timers: number[] = [];
    const t0 = 700;
    for (let i = 1; i < sim.path.length; i++) timers.push(window.setTimeout(() => setStep(i), t0 + i * STEP_MS));
    const endAt = t0 + sim.path.length * STEP_MS;
    timers.push(window.setTimeout(() => setEnded(true), endAt));
    timers.push(window.setTimeout(() => play.onDone(), endAt + 1600));
    return () => timers.forEach(clearTimeout);
  }, [play]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = result ? result.path[step] : d.start;
  const trail = new Set(result ? result.path.slice(0, step).map(key) : []);
  const dangers = new Set(play && ended ? play.reveal.dangers.map(key) : []);
  const charge = play && (ended || trail.has(key(play.reveal.charge)) || key(pos) === key(play.reveal.charge)) ? play.reveal.charge : null;
  const hitDanger = ended && result?.outcome === 'danger';
  const blocked = ended && result && ['side', 'nocharge', 'wall', 'revisit'].includes(result.outcome);
  const won = ended && result?.outcome === 'win';

  const rows = Array.from({ length: d.size }, (_, i) => d.size - i); // من الأعلى للأسفل
  const cols = Array.from({ length: d.size }, (_, i) => i + 1);

  return (
    <div className="v-robot card" ref={boxRef}>
      <div className="rb">
        <div className="rb-rows">{rows.map(r => <span key={r}>{r}</span>)}</div>
        <div className={`rb-grid${won ? ' won' : ''}`} style={{ '--n': d.size } as React.CSSProperties}>
          {rows.map(r => cols.map(c => {
            const k = `${r}-${c}`;
            const isCore = r === d.core[0] && c === d.core[1];
            const cls = [
              'cell',
              isCore && 'core',
              trail.has(k) && 'trail',
              dangers.has(k) && 'danger',
              charge && charge[0] === r && charge[1] === c && 'charge',
            ].filter(Boolean).join(' ');
            return (
              <div key={k} className={cls}>
                {isCore ? '💠' : charge && charge[0] === r && charge[1] === c ? '⚡' : null}
              </div>
            );
          }))}
          <div
            className={`bot${hitDanger ? ' boom' : ''}${blocked ? ' bump' : ''}${won ? ' win' : ''}`}
            style={{ '--r': pos[0] - 1, '--c': pos[1] - 1 } as React.CSSProperties}
            aria-hidden="true"
          >
            {hitDanger ? '💥' : '🤖'}
          </div>
        </div>
        <span />
        <div className="rb-cols">{cols.map(c => <span key={c}>{c}</span>)}</div>
      </div>

      {ended && result ? (
        <p className={`rb-status ${result.outcome === 'win' ? 'ok' : 'no'}`} role="status">{OUTCOME_TEXT[result.outcome]}</p>
      ) : (
        <p className="rb-legend">
          <span>🤖 الروبوت في الصف <b className="mono">{d.start[0]}</b> والعمود <b className="mono">{d.start[1]}</b></span>
          <span>💠 قلب نواة</span>
        </p>
      )}
    </div>
  );
}

/** ملاحظات نواة تحت الشبكة */
export function RobotNotes({ d }: { d: RobotData }) {
  return (
    <div className="v-notes card">
      <h3>ملاحظات نواة</h3>
      <ol>{d.notes.map(n => <li key={n}>{n}</li>)}</ol>
      <p className="muted small">{d.foot}</p>
    </div>
  );
}

/** أوامر الخيار كأسهم مرتبة من اليسار لليمين */
export function Arrows({ text }: { text: string }) {
  return <span className="arrows">{text.split(/\s+/).filter(Boolean).map((a, i) => <i key={i}>{a}</i>)}</span>;
}
