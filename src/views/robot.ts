/** منطق تحدي الروبوت (الوحدة 10): يحاكي الأوامر خطوة خطوة لعرض الحركة بعد الإجابة */

export type Cell = [number, number]; // [الصف من تحت، العمود من اليسار]، يبدآن من 1
export type RobotData = { size: number; start: Cell; core: Cell; notes: string[]; foot: string };
export type RobotReveal = { dangers: Cell[]; charge: Cell };
export type Outcome = 'win' | 'danger' | 'side' | 'nocharge' | 'revisit' | 'wall' | 'short';

const DELTA: Record<string, Cell> = { '↑': [1, 0], '↓': [-1, 0], '→': [0, 1], '←': [0, -1] };

export const OUTCOME_TEXT: Record<Outcome, string> = {
  win: '✅ وصل الروبوت إلى قلب نواة!',
  danger: '💥 دخل الروبوت خلية خطر.',
  side: '🔒 قلب نواة لا ينفتح إلا إذا دخله الروبوت من تحت.',
  nocharge: '🪫 وصل الروبوت بدون أن يمر على خلية الشحن.',
  revisit: '↩️ لا يستطيع الروبوت الرجوع لخلية مشى عليها.',
  wall: '🧱 هذا الأمر يُخرج الروبوت من الشبكة.',
  short: '⏹ انتهت الأوامر قبل أن يصل الروبوت.',
};

export const movesOf = (text: string) => text.split(/\s+/).filter(m => m in DELTA);

const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];

/** يرجع مواقع الروبوت بعد كل خطوة، والنتيجة النهائية، والخلية التي توقف عندها الخلل */
export function simulate(moves: string[], d: RobotData, rv: RobotReveal) {
  let pos: Cell = d.start;
  const path: Cell[] = [pos];
  let charged = false;
  for (const m of moves) {
    const [dr, dc] = DELTA[m];
    const next: Cell = [pos[0] + dr, pos[1] + dc];
    if (next[0] < 1 || next[1] < 1 || next[0] > d.size || next[1] > d.size) return { path, outcome: 'wall' as Outcome, at: next };
    if (path.some(p => same(p, next))) return { path, outcome: 'revisit' as Outcome, at: next };
    if (rv.dangers.some(p => same(p, next))) return { path: [...path, next], outcome: 'danger' as Outcome, at: next };
    if (same(next, d.core)) {
      if (m !== '↑') return { path, outcome: 'side' as Outcome, at: next };
      if (!charged) return { path, outcome: 'nocharge' as Outcome, at: next };
      return { path: [...path, next], outcome: 'win' as Outcome, at: next };
    }
    pos = next;
    path.push(pos);
    if (same(pos, rv.charge)) charged = true;
  }
  return { path, outcome: 'short' as Outcome, at: null as Cell | null };
}
