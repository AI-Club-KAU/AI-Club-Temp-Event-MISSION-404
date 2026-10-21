import { useEffect, useRef, useState } from 'react';
import { api, ApiError, local } from './api';
import { CLUB_ACCOUNT, CLUB_HASHTAG, CLUB_NAME } from './config';
import { CoreMap } from './components/CoreMap';
import type { Leaderboard, LeaderboardEntry, NodeState, Result, ReviewItem } from './types';

export const LETTERS = ['أ', 'ب', 'ج', 'د'];
export const toAr = (n: number | string) => String(n);
const fmtDuration = (sec: number) => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${toAr(m)} دقيقة و${toAr(s)} ثانية` : `${toAr(s)} ثانية`;
};
/** المدة بصيغة دقائق:ثواني، مثل 4:07 */
export const clock = (sec?: number) => (sec == null || isNaN(sec) ? '' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`);
const RANK_WORDS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
export const rankWord = (r: number) => (r <= 10 ? RANK_WORDS[r - 1] : toAr(r));
export const MEDALS = ['🥇', '🥈', '🥉'];
const medal = (r: number | null) => (r && r <= 3 ? MEDALS[r - 1] : '');
const initial = (name: string) => Array.from(name.trim())[0] || '؟';

/** شعار النادي (public/logo.png)، وإن لم يوجد يظهر الاسم نصًا */
function Brand({ note }: { note?: string }) {
  const [img, setImg] = useState(true);
  return (
    <div className="brand">
      {img ? <img src="./logo.png" alt={CLUB_NAME} onError={() => setImg(false)} /> : <b className="club-name">{CLUB_NAME}</b>}
      {note && <span>{note}</span>}
    </div>
  );
}

/* ------------------------------ البداية ------------------------------ */
export function StartScreen({ onNext, onBoard }: { onNext: () => void; onBoard: () => void }) {
  const faults: NodeState[] = Array(10).fill('fault');
  const [lead, setLead] = useState<{ top: LeaderboardEntry; count: number } | null>(null);
  useEffect(() => {
    api.leaderboard().then(r => r.entries[0] && setLead({ top: r.entries[0], count: r.finishedCount })).catch(() => {});
  }, []);
  return (
    <div className="shell stack fade-in">
      <Brand note="ليلة الذكاء" />
      <div className="hero">
        <span className="alarm"><i />SYSTEM NOT FOUND</span>
        <div className="kicker">MISSION <b>404</b></div>
        <h1>المهمة الأخيرة</h1>
      </div>
      <CoreMap states={faults} />
      <p className="center">تعطّلت «نواة»، المنظومة الذكية التي تدير «ليلة الذكاء»، قبل ساعات من انطلاقها. أمامك عشر وحدات معطّلة، وكل وحدة تعود للحياة بإجابة تستطيع إثباتها.</p>
      <div className="chips">
        <div><b>10</b><span>وحدات</span></div>
        <div><b>15–20</b><span>دقيقة</span></div>
        <div><b>100</b><span>نقطة</span></div>
      </div>
      {lead && (
        <button className="card teaser" onClick={onBoard} style={{ width: '100%', textAlign: 'right', cursor: 'pointer' }}>
          <span className="medal">🥇</span>
          <span className="who"><b>{lead.top.name}</b><span>يتصدّر الآن من بين {toAr(lead.count)} مُنقِذين</span></span>
          <span className="pts">{lead.top.score}</span>
        </button>
      )}
      <div className="dock"><div><button className="btn" onClick={onNext}>ابدأ المهمة</button></div></div>
    </div>
  );
}

/* ------------------------------ التعليمات ------------------------------ */
export function InstructionsScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="shell stack fade-in">
      <h1>قبل أن تبدأ</h1>
      <p className="muted">النظام لا يحتاج إلى أسرع إجابة دائمًا، بل إلى الإجابة التي تستطيع إثبات صحتها.</p>
      <div className="card stack-s">
        <h3>طريقة اللعب</h3>
        <ul className="acts">
          <li>10 تحديات متدرجة، لكل تحدٍّ أربعة خيارات.</li>
          <li>محاولة واحدة لكل تحدٍّ، ولا يمكن تغيير الإجابة بعد التأكيد.</li>
          <li>لا يمكن الرجوع إلى السؤال السابق بعد الانتقال إلى التالي.</li>
          <li>الإجابة الخاطئة صفر، دون خصم إضافي.</li>
          <li>التلميح اختياري ويخصم 3 نقاط من التحدي.</li>
          <li>المدة المتوقعة 15 إلى 20 دقيقة، والحد الأقصى 30 دقيقة.</li>
          <li>عند تساوي النقاط يتقدّم الأسرع.</li>
        </ul>
      </div>
      <div className="card scroll-x">
        <table className="grid">
          <thead><tr><th>التحديات</th><th>الصعوبة</th><th>النقاط</th><th>مع التلميح</th></tr></thead>
          <tbody>
            <tr><td>1 – 3</td><td>سهلة</td><td className="num">7</td><td className="num">4</td></tr>
            <tr><td>4 – 6</td><td>متوسطة</td><td className="num">9</td><td className="num">6</td></tr>
            <tr><td>7 – 8</td><td>صعبة</td><td className="num">12</td><td className="num">9</td></tr>
            <tr><td>9 – 10</td><td>متقدمة</td><td className="num">14</td><td className="num">11</td></tr>
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 8 }}>المجموع 100 نقطة. الثلاثة الأوائل يحصلون على ميداليات، وأول 5 مراكز على ألقاب خاصة.</p>
      </div>
      <div className="dock"><div>
        <button className="btn quiet" onClick={onBack}>رجوع</button>
        <button className="btn" onClick={onNext}>فهمت، أكمل</button>
      </div></div>
    </div>
  );
}

/* ------------------------------ الدخول ------------------------------ */
// يجب أن تطابق قائمة DEPARTMENTS في Code.gs حرفيًا
const DEPARTMENTS = ['الدعم والتطوير', 'العلاقات العامة', 'الإعلام والتسويق', 'التخطيط والفعاليات', 'الهاكثونات', 'التقني', 'قادة المشاريع'];

export function EntryScreen({ onStarted }: { onStarted: (r: Awaited<ReturnType<typeof api.start>>) => void }) {
  const [name, setName] = useState(local.get().name || '');
  const [dept, setDept] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await api.start(name.trim(), dept);
      local.set({ attemptId: r.attemptId, name: r.name });
      onStarted(r);
    } catch (x) {
      setError(x instanceof ApiError ? x.message : 'حدث خلل غير متوقع.');
      setBusy(false);
    }
  };
  return (
    <form className="shell stack fade-in" onSubmit={submit}>
      <Brand />
      <h1>هوية المُنقِذ</h1>
      <p className="muted">اسمك هو ما سيظهر في لوحة المتصدرين.</p>
      <div className="field">
        <label htmlFor="name">اسم العرض</label>
        <input id="name" value={name} onChange={e => setName(e.target.value)} maxLength={20} autoComplete="nickname" placeholder="مثال: سارة م" required />
      
      </div>
      <fieldset className="depts">
        <legend>قسمك في النادي</legend>
        <div className="grid2">
          {DEPARTMENTS.map((d, i) => (
            <div key={d}>
              <input type="radio" id={`dept${i}`} name="dept" value={d} checked={dept === d} onChange={() => setDept(d)} required />
              <label htmlFor={`dept${i}`}>{d}</label>
            </div>
          ))}
        </div>
      </fieldset>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="dock"><div><button className="btn" disabled={busy || name.trim().length < 2 || !dept}>{busy ? 'جارٍ الاتصال…' : 'دخول غرفة العمليات'}</button></div></div>
    </form>
  );
}

/* ------------------------------ الإقلاع ------------------------------ */
export function BootScreen({ states }: { states: NodeState[] }) {
  return (
    <div className="shell stack fade-in" aria-live="polite">
      <div className="term">
        &gt; units connected: 10 / 10{'\n'}&gt; rebooting nawa.core ...{'\n'}<span className="ok">&gt; SYSTEM FOUND</span>
      </div>
      <CoreMap states={states} coreOn booting />
      <p className="center muted">جارٍ إعادة تشغيل نواة…</p>
    </div>
  );
}

/* ------------------------------ الإكمال ------------------------------ */
function ScoreRing({ score }: { score: number }) {
  const C = 2 * Math.PI * 88;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(score), 150); return () => clearTimeout(t); }, [score]);
  return (
    <div className="ring" role="img" aria-label={`${score} من 100`}>
      <svg viewBox="0 0 200 200"><circle className="track" cx="100" cy="100" r="88" /><circle className="val" cx="100" cy="100" r="88" strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)} /></svg>
      <div className="num"><b>{score}</b><span>من 100</span></div>
    </div>
  );
}

export function CompleteScreen({ result, onReview, onBoard }: {
  result: Result; onReview: () => void; onBoard: () => void;
}) {
  const [r, setR] = useState(result);
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    const id = local.get().attemptId;
    if (!id) return;
    setBusy(true);
    try {
      const x = await api.resume(id);
      if ('score' in x) setR(x);
    } catch { /* نُبقي النتيجة الحالية */ }
    setBusy(false);
  };
  const full = r.score >= 55;
  return (
    <div className="shell stack fade-in">
      <div className="term center"><span className="ok">SYSTEM RESTORED</span></div>
      <p className="center muted">{r.name}، أنهيت المهمة في {fmtDuration(r.durationSec)}</p>
      <ScoreRing score={r.score} />
      {r.rank && (
        <div className="rankline">
          {r.title && <span className="title">{medal(r.rank)} {r.title}</span>}
          {r.final ? 'مركزك النهائي' : 'مركزك الآن'}: {rankWord(r.rank)} من {toAr(r.of)}
          {!r.final && <div><button className="link" onClick={refresh} disabled={busy}>{busy ? 'جارٍ التحديث…' : 'تحديث المركز'}</button></div>}
        </div>
      )}
      <div className="facts four">
        <div><b>{clock(r.durationSec)}</b><span>الوقت</span></div>
        <div><b>{r.correctCount}/10</b><span>صحيحة</span></div>
        <div><b>{r.hintsUsed}</b><span>تلميحات</span></div>
        <div><b>{r.rank ?? '—'}</b><span>المركز</span></div>
      </div>
      <div className="card quote">«{r.ending}»</div>
      {full && (
        <div className="stack-s">
          <p>لم تستعد نواة عملها لأنك وجدت الإجابات فحسب، بل لأنك حللت الأنماط، واختبرت الأرقام، وكشفت المعلومات المضللة، وراجعت المخرجات بدلًا من قبولها دون تحقق.</p>
        </div>
      )}
      <p>لقد أثبتَّ أن التعامل الذكي مع الذكاء الاصطناعي لا يعتمد على الثقة العمياء، بل على التفكير والتحليل والتحقق.</p>
      <div className="dock"><div>
        <button className="btn quiet" onClick={onReview}>مراجعة الإجابات</button>
        <button className="btn" onClick={onBoard}>لوحة المتصدرين</button>
      </div></div>
    </div>
  );
}

/* ------------------------------ المراجعة ------------------------------ */
export function ReviewScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const id = local.get().attemptId;
    if (!id) { setError('لم نجد محاولتك على هذا الجهاز.'); return; }
    api.review(id).then(r => setItems(r.items)).catch(x => setError(x.message));
  }, []);
  return (
    <div className="shell stack fade-in">
      <h1>مراجعة الإجابات</h1>
      {error && <div className="alert">{error}</div>}
      {!items && !error && <p className="muted">جارٍ التحميل…</p>}
      {items?.map(it => {
        const chosen = it.options.find(o => o.id === it.chosen);
        const right = it.options.find(o => o.id === it.correctOption)!;
        return (
          <div className="card stack-s" key={it.id}>
            <div className={`verdict ${it.correct ? 'ok' : 'no'}`}>
              <div className="icon" aria-hidden="true">{it.correct ? '✓' : '✕'}</div>
              <div>
                <h2 style={{ fontSize: 19 }}>{toAr(it.n)}. {it.unit}</h2>
                <div className="pts">{it.points}/{it.max}</div>
                {it.hinted && <div className="muted small">استُخدم التلميح</div>}
              </div>
            </div>
            <p>{it.question}</p>
            <p><span className="muted">إجابتك: </span><span className={chosen?.ltr ? 'mono' : ''}>{chosen ? chosen.text : 'لم تُجب'}</span></p>
            {!it.correct && <p><span className="muted">الإجابة الصحيحة: </span><span className={right.ltr ? 'mono' : ''} style={{ color: 'var(--restored)' }}>{right.text}</span></p>}
            <p className="muted">{it.explanation}</p>
          </div>
        );
      })}
      <div className="dock"><div><button className="btn quiet" onClick={onBack}>رجوع</button></div></div>
    </div>
  );
}

/* ------------------------------ لوحة المتصدرين ------------------------------ */
function Podium({ top, me }: { top: LeaderboardEntry[]; me?: string }) {
  // الترتيب المرئي في العربية: الثاني يمينًا، الأول في الوسط، الثالث يسارًا
  const order = [top[1], top[0], top[2]];
  return (
    <div className="podium">
      {order.map((e, i) => {
        const place = [2, 1, 3][i];
        if (!e) return <div key={place} />;
        return (
          <div key={place} className={`pod p${place}${e.name === me ? ' me' : ''}`}>
            <span className="medal" aria-label={`المركز ${rankWord(place)}`}>{MEDALS[place - 1]}</span>
            <span className="av" aria-hidden="true">{initial(e.name)}</span>
            <span className="nm">{e.name}</span>
            <span className="tt">{e.title}</span>
            <span className="base"><span>{e.score}<small>⏱ {clock(e.time)}</small></span></span>
          </div>
        );
      })}
    </div>
  );
}

export function BoardScreen({ onBack, onEnd }: { onBack?: () => void; onEnd?: () => void }) {
  const [lb, setLb] = useState<Leaderboard | null>(null);
  const [error, setError] = useState('');
  const [next, setNext] = useState(20);
  const [flash, setFlash] = useState(false);
  const meRef = useRef<HTMLDivElement>(null);
  const me = local.get().name;
  useEffect(() => {
    let alive = true;
    const load = () => api.leaderboard().then(r => { if (alive) { setLb(r); setError(''); setNext(20); } }).catch(x => alive && setError(x.message));
    load();
    const t = setInterval(load, 20000);
    const c = setInterval(() => setNext(n => Math.max(0, n - 1)), 1000);
    return () => { alive = false; clearInterval(t); clearInterval(c); };
  }, []);
  const rest = lb ? lb.entries.slice(3) : [];
  const meInRest = rest.some(e => e.name === me);
  const findMe = () => {
    meRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(true); setTimeout(() => setFlash(false), 1500);
  };
  return (
    <div className="shell stack fade-in">
      <div className="board-head">
        <div>
          <h1>المُنقِذون</h1>
          {lb && <p className="muted small">{toAr(lb.finishedCount)} أنهوا المهمة{lb.final ? '' : `، تحديث بعد ${toAr(next)} ث`}</p>}
        </div>
        {lb && (lb.final
          ? <span className="live final"><i />النتائج النهائية</span>
          : <span className="live"><i />مباشر</span>)}
      </div>
      {error && <div className="alert">{error}</div>}
      {lb && lb.entries.length === 0 && <div className="card center muted">لم يُنهِ أحد المهمة بعد. كن أول المُنقِذين.</div>}
      {lb && lb.entries.length > 0 && <Podium top={lb.entries.slice(0, 3)} me={me} />}
      {meInRest && <button className="link" onClick={findMe}>أين أنا؟</button>}
      {rest.length > 0 && (
        <div className="lb-list">
          {rest.map(e => {
            const mine = e.name === me;
            return (
              <div key={e.rank} ref={mine ? meRef : undefined} className={`lb-row${mine ? ' me' : ''}${mine && flash ? ' flash' : ''}`}>
                <span className="rk">{e.rank}</span>
                <span className="av" aria-hidden="true">{initial(e.name)}</span>
                <span className="who">
                  <b>{e.name}{mine && <span className="you-pill">أنت</span>}</b>
                  <span className={e.rank <= 5 ? 'top' : ''}>{e.title}</span>
                  <span className="bar" aria-hidden="true"><i style={{ width: `${e.score}%` }} /></span>
                </span>
                <span className="sc">{e.score}<small>⏱ {clock(e.time)}</small></span>
              </div>
            );
          })}
        </div>
      )}
      <div className="dock"><div>
        {onBack && <button className="btn quiet" onClick={onBack}>رجوع</button>}
        {onEnd && <button className="btn" onClick={onEnd}>إنهاء</button>}
      </div></div>
    </div>
  );
}

/* ------------------------------ النهاية ------------------------------ */
export function EndScreen() {
  const all: NodeState[] = Array(10).fill('restored');
  return (
    <div className="shell stack fade-in center">
      <CoreMap states={all} coreOn />
      <h1>عادت نواة إلى العمل</h1>
      <p>«ليلة الذكاء» تبدأ الآن، بفضل مَن لاحظ، وحسب، وتحقّق.</p>
      <p className="muted">المهمة انتهت، لكن العادة تبدأ الآن: لاحِظ، واحسب، وتحقّق قبل أن تثق.</p>
      <div className="spacer" />
      <div style={{ display: 'flex', justifyContent: 'center' }}><Brand /></div>
      <p className="muted small"><span className="mono">{CLUB_ACCOUNT}</span>، {CLUB_HASHTAG}</p>
    </div>
  );
}
