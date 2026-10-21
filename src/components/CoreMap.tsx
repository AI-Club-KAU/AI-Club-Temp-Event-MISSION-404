import type { NodeState } from '../types';

const SHORT = ['الأضواء', 'الطاقة', 'السجل', 'الرسائل', 'الاستبيان', 'الروابط', 'القفل', 'التحليل', 'الجدولة', 'القرار'];
const AR = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/**
 * مخطط نواة الكامل: النواة في المركز وحولها الوحدات العشر كلوحة دائرة إلكترونية.
 * يبدأ من الأعلى ويدور مع عقارب الساعة.
 */
export function CoreMap({ states, coreOn, booting }: { states: NodeState[]; coreOn?: boolean; booting?: boolean }) {
  const C = 210, R = 132, L = 176, S = 30;
  const pts = states.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / states.length;
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a), lx: C + L * Math.cos(a), ly: C + L * Math.sin(a), cos: Math.cos(a) };
  });
  return (
    <svg className={`coremap${booting ? ' booting' : ''}`} viewBox="0 0 420 420" role="img"
      aria-label={`مخطط نواة: ${states.filter(s => s === 'restored').length} وحدات مستعادة من 10`}>
      <circle className="inner" cx={C} cy={C} r={84} />
      {pts.map((p, i) => {
        // مسار بزاوية قائمة من الوحدة إلى حلقة النواة، مثل مسارات اللوحات الإلكترونية
        const ix = C + 48 * (p.x - C) / R, iy = C + 48 * (p.y - C) / R;
        const d = `M${p.x} ${p.y} L${p.x} ${(p.y + iy) / 2} L${ix} ${(p.y + iy) / 2} L${ix} ${iy}`;
        const s = states[i];
        return <path key={i} d={d} className={`trace${s === 'restored' ? ' lit' : s === 'partial' ? ' half' : ''}`} />;
      })}
      <circle className={`core-ring${coreOn ? ' on' : ''}`} cx={C} cy={C} r={44} />
      <text className="core-name" x={C} y={C + 6} textAnchor="middle">نواة</text>
      {pts.map((p, i) => (
        <g key={i} className={`node ${states[i]}`}>
          <rect x={p.x - S / 2} y={p.y - S / 2} width={S} height={S} rx={6} />
          <text className="num" x={p.x} y={p.y + 4.5} textAnchor="middle">{AR[i]}</text>
          <text className="label" x={p.lx} y={p.ly + 4}
            textAnchor={Math.abs(p.cos) < 0.3 ? 'middle' : p.cos > 0 ? 'start' : 'end'}>{SHORT[i]}</text>
        </g>
      ))}
    </svg>
  );
}

/** الشريط المصغّر أعلى شاشة التحدي: عشر عقد على مسار واحد، الأولى يمينًا */
export function Rail({ states, pulse }: { states: NodeState[]; pulse?: number }) {
  const done = states.filter(s => s === 'restored' || s === 'partial').length;
  return (
    <div className="rail" role="img" aria-label={`الوحدات المتصلة ${done} من ${states.length}`}>
      {states.map((s, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className={`wire${states[i - 1] === 'restored' && (s === 'restored' || s === 'current') ? ' lit' : ''}`} />}
          <span className={`dot ${s}${pulse === i ? ' pulse' : ''}`} title={SHORT[i]} />
        </span>
      ))}
    </div>
  );
}
