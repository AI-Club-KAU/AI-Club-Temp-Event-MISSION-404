import { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import { ChallengeData } from './views/ChallengeData';
import { LETTERS, toAr } from './screens';
import type { AnswerResponse, Challenge, NodeState, Progress } from './types';

// أيقونات الوحدات كما في ملف التحديات
const ICONS = ['💡', '🔋', '🗂️', '📩', '📊', '🔗', '🔐', '📈', '🗓️', '🧠'];
const LEVEL_CLASS: Record<string, string> = { 'سهل': 'easy', 'متوسط': 'mid', 'صعب': 'hard', 'متقدم': 'hard' };

type Props = {
  attemptId: string;
  ch: Challenge;
  index: number;
  states: NodeState[];
  progress: Progress;
  expiresAt: number;
  onAnswered: (r: AnswerResponse) => void;
  onHint: (hint: string) => void;
  onNext: () => void;
  onExpired: () => void;
  feedback: AnswerResponse | null;
};

function Clock({ expiresAt, onExpired }: { expiresAt: number; onExpired: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, expiresAt - now);
  useEffect(() => { if (left === 0) onExpired(); }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  return <span className={`clock${left < 3 * 60000 ? ' low' : ''}`} aria-label="الوقت المتبقي">⏱ {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>;
}

/** شريط التقدم: عشر خانات مرقّمة، الأولى يمينًا */
function Segments({ states, pulse }: { states: NodeState[]; pulse?: number }) {
  const done = states.filter(s => s === 'restored' || s === 'partial').length;
  return (
    <div className="segs" role="img" aria-label={`الوحدات المتصلة ${done} من ${states.length}`}>
      {states.map((s, i) => <span key={i} className={`${s}${pulse === i ? ' pulse' : ''}`}>{i + 1}</span>)}
    </div>
  );
}

export function ChallengeScreen(p: Props) {
  const { ch, progress, feedback } = p;
  const [choice, setChoice] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setChoice(null); setAsking(false); setError(''); window.scrollTo(0, 0); }, [ch.id]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await fn(); } catch (x) {
      const e = x as ApiError;
      if (e.code === 'TIME_UP') return p.onExpired();
      setError(e.message || 'حدث خلل غير متوقع.');
    } finally { setBusy(false); }
  };

  const takeHint = () => run(async () => {
    const r = await api.hint(p.attemptId, ch.id);
    setAsking(false);
    p.onHint(r.hint);
  });

  const submit = () => choice && run(async () => {
    const r = await api.answer(p.attemptId, ch.id, choice);
    p.onAnswered(r);
  });

  const locked = !!feedback;

  return (
    <div className="shell stack fade-in" key={ch.id}>
      <header className="ch-head">
        <Segments states={p.states} pulse={feedback?.correct ? p.index : undefined} />
        <div className="ch-meta">
          <span>الوحدة {toAr(ch.n)} من 10</span>
          <Clock expiresAt={p.expiresAt} onExpired={p.onExpired} />
        </div>
      </header>

      <div className="unit">
        <span className="ico" aria-hidden="true">{ICONS[p.index]}</span>
        <div>
          <h2>{ch.unit}</h2>
          <div className="badges">
            <span className={`badge lv-${LEVEL_CLASS[ch.level] || 'mid'}`}>{ch.level}</span>
            <span className="badge">{toAr(ch.points)} نقاط</span>
          </div>
        </div>
      </div>

      <p className="story"><span className="from">نواة</span>{ch.story}</p>

      <ChallengeData ch={ch} />

      <div className="question">
        <span className="q-label">السؤال</span>
        <h3>{ch.question}</h3>
      </div>

      <div className="options" role="radiogroup" aria-label="الخيارات">
        {ch.options.map((o, i) => (
          <button key={o.id} type="button" role="radio" className="opt" aria-checked={choice === o.id}
            disabled={locked || busy} onClick={() => setChoice(o.id)}>
            <span className="key">{LETTERS[i]}</span>
            <span className={`txt${o.ltr ? ' ltr' : ''}`}>{o.text}</span>
          </button>
        ))}
      </div>

      {!locked && (
        progress.hint ? (
          <div className="hint-box"><b>تلميح: </b>{progress.hint}</div>
        ) : asking ? (
          <div className="confirm">
            <span>التلميح سيخصم 3 نقاط من هذه الوحدة. هل تريده؟</span>
            <div className="row">
              <button className="btn" onClick={takeHint} disabled={busy}>نعم، أظهره</button>
              <button className="btn quiet" onClick={() => setAsking(false)} disabled={busy}>لا</button>
            </div>
          </div>
        ) : (
          <div><button className="hint-btn" onClick={() => setAsking(true)}>💡 أحتاج تلميحًا (−3 نقاط)</button></div>
        )
      )}

      {error && <div className="alert" role="alert">{error}</div>}

      {!feedback && (
        <div className="dock"><div>
          <button className="btn" onClick={submit} disabled={!choice || busy}>{busy ? 'جارٍ الإرسال…' : 'تأكيد الإجابة'}</button>
        </div></div>
      )}

      {feedback && (
        <>
          <div className="sheet-backdrop" />
          <div className={`sheet ${feedback.correct ? 'ok' : 'no'}`} role="dialog" aria-live="polite" aria-label="نتيجة الوحدة">
            <div className="stack-s">
              <div className={`verdict ${feedback.correct ? 'ok' : 'no'}`}>
                <div className="icon" aria-hidden="true">{feedback.correct ? '✓' : '✕'}</div>
                <div>
                  <h2>{feedback.correct ? 'وحدة مستعادة' : 'استعادة جزئية'}</h2>
                  <div className="pts">+{feedback.points} / {feedback.max}</div>
                </div>
              </div>
              <p>{feedback.message}</p>
              <button className={`btn block${feedback.correct ? ' mint' : ''}`} onClick={p.onNext} autoFocus>
                {feedback.done ? 'إعادة تشغيل نواة' : 'الوحدة التالية'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
