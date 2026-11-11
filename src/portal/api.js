// Talks to the Smart Schools server (smart-schools-app). Teachers send a bearer token; students send a private player id.

const DEV_PORTS = ['5190', '5173', '4173', '4174'];

/** Where the API lives. On the dev server of the website it is the Smart Schools server on port 8787 of the same machine. */
export const API = (() => {
  const env = import.meta.env.VITE_API_BASE;
  if (env) return String(env).replace(/\/$/, '');
  return DEV_PORTS.includes(location.port) ? `${location.protocol}//${location.hostname}:8787` : '';
})();

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let token = '';
export const setToken = (t) => { token = t || ''; };

async function call(method, path, body) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'offline');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'error');
  return data;
}

const q = (o) => new URLSearchParams(o).toString();

export const api = {
  info: () => call('GET', '/api/portal/info'),
  login: (username, password) => call('POST', '/api/portal/auth/login', { username, password }),
  register: (username, password, name) => call('POST', '/api/portal/auth/register', { username, password, name }),
  me: () => call('GET', '/api/portal/me'),
  topics: (lang) => call('GET', `/api/portal/topics?${q({ lang })}`),
  quizzes: () => call('GET', '/api/portal/quizzes'),
  quiz: (id) => call('GET', `/api/portal/quizzes/${id}`),
  createQuiz: (quiz) => call('POST', '/api/portal/quizzes', quiz),
  saveQuiz: (id, quiz) => call('PUT', `/api/portal/quizzes/${id}`, quiz),
  deleteQuiz: (id) => call('POST', `/api/portal/quizzes/${id}/delete`, {}),
  genTopic: (topicId, count, lang) => call('POST', '/api/portal/generate/topic', { topicId, count, lang }),
  genMath: (params) => call('POST', '/api/portal/generate/math', params),
  genAi: (topic, count, lang, grade, extra = {}) => call('POST', '/api/portal/generate/ai', { topic, count, lang, grade, ...extra }),
  insights: () => call('GET', '/api/portal/insights'),
  assistant: (message, history) => call('POST', '/api/portal/assistant', { message, history }),
  createSession: (opts) => call('POST', '/api/portal/sessions', opts),
  session: (code) => call('GET', `/api/portal/sessions/${code}`),
  action: (code, action, pid) => call('POST', `/api/portal/sessions/${code}/action`, { action, pid }),
  history: () => call('GET', '/api/portal/history'),
  historyOne: (code) => call('GET', `/api/portal/history/${code}`),
  peek: (code) => call('GET', `/api/play/peek?${q({ code })}`),
  join: (code, name, team) => call('POST', '/api/play/join', { code, name, team }),
  state: (code, pid) => call('GET', `/api/play/state?${q({ code, pid })}`),
  answer: (code, pid, a) => call('POST', '/api/play/answer', { code, pid, ...a }),
};
