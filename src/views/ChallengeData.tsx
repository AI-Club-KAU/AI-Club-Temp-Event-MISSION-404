import type { Challenge } from '../types';
import { RobotBoard, RobotNotes, type RobotPlay } from './RobotBoard';
import './views.css';

/** يعرض معطيات كل تحدٍّ بشكل الشيء الذي تمثّله، دون أي معلومة تكشف الإجابة */
export function ChallengeData({ ch, play }: { ch: Challenge; play?: RobotPlay | null }) {
  const d = ch.data;
  switch (ch.view) {
    case 'lights':
      return (
        <div className="v-lights card" aria-label="صفوف الأضواء">
          {(d.rows as number[]).map((n, i) => (
            <div className="lrow" key={i}>
              <span className="lbl">الصف {i + 1}</span>
              <span className="bulbs">{Array.from({ length: n }, (_, k) => <i key={k} />)}</span>
              <span className="n mono">{n}</span>
            </div>
          ))}
          <div className="lrow unknown">
            <span className="lbl">الصف 6</span>
            <span className="bulbs off"><i /><i /><i /></span>
            <span className="n mono">?</span>
          </div>
        </div>
      );

    case 'equations':
      return (
        <div className="v-eq card">
          {(d.lines as string[]).map((l, i) => <div className="eq mono" key={i}>{l}</div>)}
          <div className="eq ask mono">{d.ask}</div>
        </div>
      );

    case 'log':
      return (
        <div className="v-log">
          <div className="bar"><span className="mono">fault.log</span></div>
          <div className="body">
            {(d.lines as string[]).map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      );

    case 'messages':
      return (
        <div className="stack">
          <div className="v-facts card">
            <h3>بطاقة الحقائق الرسمية</h3>
            <ol>{(d.facts as string[]).map((f, i) => <li key={i}>{f}</li>)}</ol>
          </div>
          <div className="v-chat">
            {(d.messages as { label: string; text: string }[]).map(m => (
              <div className="bubble" key={m.label}><b>{m.label}</b><span>{m.text}</span></div>
            ))}
          </div>
        </div>
      );

    case 'survey':
      return (
        <div className="stack">
          <div className="v-ai card"><span className="tag">ملخص المساعد الذكي</span><p>«{d.summary}»</p></div>
          <div className="facts">
            <div><b>{d.sent}</b><span>أُرسل لهم</span></div>
            <div><b>{d.answered}</b><span>أجابوا</span></div>
            <div><b>{d.morning}</b><span>اختاروا الصباح</span></div>
          </div>
        </div>
      );

    case 'links':
      return <div className="v-rule card"><h3>قاعدة التحقق</h3><p>{d.rule}</p></div>;

    case 'lock':
      return (
        <div className="stack">
          <div className="v-lock card">
            <div className="slots">{['?', '?', '?'].map((s, i) => <span key={i} className="slot mono">{s}</span>)}</div>
            <div className="slot-names"><span>يسار</span><span>وسط</span><span>يمين</span></div>
          </div>
          <div className="v-clues">
            {(d.clues as { code: string; text: string }[]).map(c => (
              <div className="clue card" key={c.code}>
                <div className="digits">{c.code.split('').map((x, i) => <span key={i} className="mono">{x}</span>)}</div>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
          <p className="muted small">{d.note}</p>
        </div>
      );

    case 'analysis':
      return (
        <div className="v-bars card">
          <h3>نتائج الاستبيان ({d.total} عضوًا)</h3>
          {(d.rows as { label: string; n: number }[]).map(r => (
            <div className="bar-row" key={r.label}>
              <span className="lbl">{r.label}</span>
              <span className="track"><span className="fill" style={{ width: `${(r.n / d.total) * 100}%` }} /></span>
              <span className="n mono">{r.n}</span>
            </div>
          ))}
        </div>
      );

    case 'rooms':
      return (
        <div className="stack">
          <div className="v-rooms">
            {(d.rooms as { name: string; seats: number; pcs: boolean }[]).map(r => (
              <div className="room card" key={r.name}>
                <h3>{r.name}</h3>
                <div><span className="mono">{r.seats}</span> مقعدًا</div>
                <div className={r.pcs ? 'pc yes' : 'pc no'}>{r.pcs ? 'مع أجهزة حاسب' : 'بدون أجهزة حاسب'}</div>
              </div>
            ))}
          </div>
          <div className="card"><h3>الأنشطة (في الوقت نفسه)</h3><ul className="acts">{(d.activities as string[]).map(a => <li key={a}>{a}</li>)}</ul></div>
        </div>
      );

    case 'compare':
      return (
        <div className="stack">
          <div className="card v-compare-wrap">
            <table className="grid v-compare">
              <thead><tr><th>المعلومة</th>{(d.columns as string[]).map((c, i) => <th key={c} className={i === 0 ? 'official' : ''}>{c}</th>)}</tr></thead>
              <tbody>
                {(d.rows as { label: string; values: string[] }[]).map(r => (
                  <tr key={r.label}><td>{r.label}</td>{r.values.map((v, i) => <td key={i} className={i === 0 ? 'official' : ''}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="v-rule card"><h3>قاعدة الفريق</h3><p>{d.rule}</p></div>
        </div>
      );

    case 'robot':
      return (
        <div className="stack">
          <RobotBoard d={d} play={play} />
          <RobotNotes d={d} />
        </div>
      );

    default:
      return null;
  }
}
