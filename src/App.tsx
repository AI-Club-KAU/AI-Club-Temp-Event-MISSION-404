import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, local } from './api';
import { BOARD_HASH } from './config';
import { ChallengeScreen } from './ChallengeScreen';
import {
  BoardScreen, BootScreen, CompleteScreen, EndScreen, EntryScreen,
  InstructionsScreen, ReviewScreen, StartScreen,
} from './screens';
import type { AnswerResponse, NodeState, Progress, Result, StartResponse } from './types';

type Screen = 'loading' | 'start' | 'instructions' | 'entry' | 'challenge' | 'boot' | 'complete' | 'review' | 'board' | 'end';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [game, setGame] = useState<StartResponse | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [fatal, setFatal] = useState('');

  // عند فتح الموقع: إن كانت هناك محاولة محفوظة على هذا الجهاز نكملها
  useEffect(() => {
    // رابط المنظمين: يفتح اللوحة مباشرة دون لعب
    if (location.hash === `#${BOARD_HASH}`) { setScreen('board'); return; }
    const id = local.get().attemptId;
    if (!id) { setScreen('start'); return; }
    api.resume(id)
      .then(r => {
        if ('challenges' in r) begin(r);
        else { setResult(r); setScreen('complete'); }
      })
      .catch(() => { local.clearAttempt(); setScreen('start'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = (r: StartResponse) => {
    setGame(r);
    setProgress(r.progress);
    const next = r.progress.findIndex(p => !p.answered);
    if (next === -1) { finish(r.attemptId); return; }
    setIndex(next);
    setFeedback(null);
    setScreen('challenge');
  };

  const finish = async (attemptId: string) => {
    setScreen('boot');
    const started = Date.now();
    try {
      const r = await api.finish(attemptId);
      // نترك لحظة الإقلاع تكتمل قبل عرض النتيجة
      await new Promise(res => setTimeout(res, Math.max(0, 2600 - (Date.now() - started))));
      setResult(r);
      setScreen('complete');
    } catch (x) {
      setFatal((x as ApiError).message);
    }
  };

  const states: NodeState[] = useMemo(() => progress.map((p, i) =>
    p.answered ? (p.correct ? 'restored' : 'partial') : (screen === 'challenge' && i === index ? 'current' : 'fault')),
  [progress, index, screen]);

  const onAnswered = (r: AnswerResponse) => {
    setFeedback(r);
    setProgress(ps => ps.map(p => p.id === r.challengeId ? { ...p, answered: true, correct: r.correct } : p));
  };

  const onHint = (hint: string) =>
    setProgress(ps => ps.map((p, i) => i === index ? { ...p, hinted: true, hint } : p));

  const onNext = () => {
    if (!game) return;
    const next = progress.findIndex(p => !p.answered);
    if (next === -1) { finish(game.attemptId); return; }
    setFeedback(null);
    setIndex(next);
  };

  const onExpired = () => { if (game && screen === 'challenge') finish(game.attemptId); };

  if (fatal) {
    return (
      <div className="shell stack">
        <div className="alert" role="alert">{fatal}</div>
        <button className="btn" onClick={() => location.reload()}>تحديث الصفحة</button>
      </div>
    );
  }

  switch (screen) {
    case 'loading':
      return <div className="shell"><p className="term">&gt; connecting to nawa.core ...</p></div>;
    case 'start':
      return <StartScreen onNext={() => setScreen('instructions')} onBoard={() => setScreen('board')} />;
    case 'instructions':
      return <InstructionsScreen onNext={() => setScreen('entry')} onBack={() => setScreen('start')} />;
    case 'entry':
      return <EntryScreen onStarted={begin} />;
    case 'challenge':
      return game && (
        <ChallengeScreen
          attemptId={game.attemptId}
          ch={game.challenges[index]}
          index={index}
          states={states}
          progress={progress[index]}
          expiresAt={game.expiresAt}
          feedback={feedback}
          onAnswered={onAnswered}
          onHint={onHint}
          onNext={onNext}
          onExpired={onExpired}
        />
      );
    case 'boot':
      return <BootScreen states={states} />;
    case 'complete':
      return result && (
        <CompleteScreen result={result} onReview={() => setScreen('review')} onBoard={() => setScreen('board')} />
      );
    case 'review':
      return <ReviewScreen onBack={() => setScreen('complete')} />;
    case 'board':
      return result
        ? <BoardScreen onBack={() => setScreen('complete')} onEnd={() => setScreen('end')} />
        : <BoardScreen onBack={() => setScreen('start')} />;
    case 'end':
      return <EndScreen onBoard={() => setScreen('board')} />;
  }
}
