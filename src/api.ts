import { API_URL } from './config';
import type { AnswerResponse, HintResponse, Leaderboard, Result, ReviewItem, StartResponse } from './types';

/** رسائل الأخطاء بلغة القصة، مع ما يجب على المشارك فعله */
const MESSAGES: Record<string, string> = {
  EVENT_CLOSED: 'غرفة العمليات مغلقة الآن. انتظر إعلان المنظمين.',
  BAD_NAME: 'اسم العرض يجب أن يكون من 2 إلى 20 حرفًا، حروفًا وأرقامًا فقط.',
  BAD_DEPT: 'اختر قسمك من القائمة.',
  NAME_TAKEN: 'هذا الاسم مستخدم. أضف حرفًا يميّزك، مثل أول حرف من اسم العائلة: «سارة م».',
  TIME_UP: 'انتهت الـ 30 دقيقة. احتُسبت الوحدات التي أنجزتها.',
  ATTEMPT_CLOSED: 'انتهت هذه المحاولة.',
  ALREADY_ANSWERED: 'هذه الوحدة أُرسلت إجابتها من قبل.',
  NO_ATTEMPT: 'لم نجد محاولتك. ابدأ مهمة جديدة.',
  BUSY: 'نواة مشغولة بطلبات كثيرة. حاول مجددًا بعد ثوانٍ.',
  NETWORK: 'انقطع الاتصال بغرفة العمليات. تحقّق من الإنترنت وحاول مجددًا.',
  NO_CONFIG: 'الموقع غير مربوط بالخادم بعد. ضعي رابط /exec في ملف src/config.ts.',
  SERVER_ERROR: 'حدث خلل غير متوقع. حدّث الصفحة، وستكمل من حيث توقفت.',
};

export class ApiError extends Error {
  code: string;
  constructor(code: string) {
    super(MESSAGES[code] || MESSAGES.SERVER_ERROR);
    this.code = code;
  }
}

async function send(payload: object): Promise<Response> {
  // text/plain لأن Apps Script لا يجيب على طلبات CORS التمهيدية
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
}

async function call<T>(action: string, body: object = {}): Promise<T> {
  if (!API_URL || API_URL.includes('PASTE_')) throw new ApiError('NO_CONFIG');
  const payload = { action, ...body };
  let res: Response;
  try {
    res = await send(payload);
  } catch {
    // محاولة ثانية واحدة عند انقطاع مؤقت
    await new Promise(r => setTimeout(r, 1200));
    try {
      res = await send(payload);
    } catch {
      throw new ApiError('NETWORK');
    }
  }
  let json: { ok: boolean; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new ApiError('SERVER_ERROR');
  }
  if (!json.ok) throw new ApiError(json.error || 'SERVER_ERROR');
  return json as T;
}

export const api = {
  start: (name: string, department: string) => call<StartResponse>('start', { name, department }),
  resume: (resumeId: string) => call<StartResponse | Result>('start', { resumeId }),
  hint: (attemptId: string, challengeId: string) => call<HintResponse>('hint', { attemptId, challengeId }),
  answer: (attemptId: string, challengeId: string, answer: string) =>
    call<AnswerResponse>('answer', { attemptId, challengeId, answer }),
  finish: (attemptId: string) => call<Result>('finish', { attemptId }),
  review: (attemptId: string) => call<{ ok: true; items: ReviewItem[] }>('review', { attemptId }),
  leaderboard: () => call<Leaderboard>('leaderboard'),
};

/** تخزين خفيف في المتصفح: رقم المحاولة لاستكمالها بعد التحديث، واسم العرض لتمييز صفه في اللوحة */
const KEY = 'mission404';
export const local = {
  get(): { attemptId?: string; name?: string } {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  },
  set(v: { attemptId?: string; name?: string }) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...local.get(), ...v }));
    } catch {
      /* التصفح الخفي: نكمل بدون حفظ */
    }
  },
  clearAttempt() {
    try {
      const v = local.get();
      delete v.attemptId;
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* لا شيء */
    }
  },
};