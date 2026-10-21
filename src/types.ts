export type Option = { id: string; text: string; ltr?: boolean };

export type Challenge = {
  n: number;
  id: string;
  unit: string;
  level: string;
  points: number;
  story: string;
  view: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  question: string;
  options: Option[];
};

export type Progress = {
  id: string;
  answered: boolean;
  correct: boolean;
  hinted: boolean;
  hint: string | null;
};

export type StartResponse = {
  ok: true;
  resumed: boolean;
  attemptId: string;
  name: string;
  startedAt: number;
  expiresAt: number;
  rules: { total: number; hintCost: number; minutes: number };
  progress: Progress[];
  challenges: Challenge[];
};

export type Result = {
  ok: true;
  name: string;
  score: number;
  correctCount: number;
  hintsUsed: number;
  durationSec: number;
  rank: number | null;
  of: number;
  title: string | null;
  ending: string;
  final: boolean;
  verifyCode: string;
  alreadyFinished?: boolean;
};

export type AnswerResponse = {
  ok: true;
  challengeId: string;
  correct: boolean;
  points: number;
  max: number;
  message: string;
  done: boolean;
};

export type HintResponse = { ok: true; challengeId: string; hint: string; cost: number };

export type ReviewItem = {
  n: number;
  id: string;
  unit: string;
  question: string;
  options: Option[];
  chosen: string | null;
  correctOption: string;
  correct: boolean;
  hinted: boolean;
  points: number;
  max: number;
  explanation: string;
};

export type LeaderboardEntry = { rank: number; name: string; score: number; time?: number; title: string | null };
export type Leaderboard = {
  ok: true;
  final: boolean;
  finishedCount: number;
  updatedAt: number;
  entries: LeaderboardEntry[];
};

/** حالة كل وحدة في مخطط نواة */
export type NodeState = 'fault' | 'current' | 'restored' | 'partial';
