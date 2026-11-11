import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { HttpError } from './http.ts';
import { readJsonFile, writeJsonAtomic } from './jsonFile.ts';

/**
 * Teacher accounts for the website portal: a username, a password kept only as a scrypt hash, and signed tokens.
 * Students never have accounts: they join a live game with a code and a first name.
 */
export interface Teacher {
  id: string;
  username: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: number;
}
export interface PublicTeacher {
  id: string;
  username: string;
  name: string;
}

const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const TOKEN_DAYS = 7;
const KEY_LEN = 32;

export const publicTeacher = (t: Teacher): PublicTeacher => ({ id: t.id, username: t.username, name: t.name });

/** The signing secret: from the environment, or made once and kept next to the data (never in the code). */
function loadSecret(dir: string, fromEnv?: string): string {
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  const file = path.join(dir, 'portal-secret.txt');
  if (existsSync(file)) {
    const s = readFileSync(file, 'utf8').trim();
    if (s.length >= 32) return s;
  }
  mkdirSync(dir, { recursive: true });
  const s = randomBytes(32).toString('hex');
  writeFileSync(file, s, { mode: 0o600 });
  try {
    chmodSync(file, 0o600);
  } catch {
    /* not every file system supports it */
  }
  return s;
}

export interface AccountsOptions {
  dir: string;
  secret?: string;
  now?: () => number;
  maxTeachers?: number;
}

export function createAccounts(opts: AccountsOptions) {
  const now = opts.now ?? Date.now;
  const file = path.join(opts.dir, 'teachers.json');
  const secret = loadSecret(opts.dir, opts.secret);
  const max = opts.maxTeachers ?? 500;
  const db: { teachers: Teacher[] } = readJsonFile(file, { teachers: [] });
  const save = () => writeJsonAtomic(file, db);

  const hashPassword = (password: string, salt: string) => scryptSync(password, salt, KEY_LEN).toString('hex');
  // A login for an unknown name still does the same work, so the answer time does not reveal which names exist.
  const dummySalt = randomBytes(16).toString('hex');
  const sign = (payload: string) => createHmac('sha256', secret).update(payload).digest('base64url');

  const issue = (t: Teacher): string => {
    const payload = Buffer.from(JSON.stringify({ sub: t.id, exp: Math.floor(now() / 1000) + TOKEN_DAYS * 86400 })).toString('base64url');
    return `${payload}.${sign(payload)}`;
  };

  function verify(token: string | undefined | null): Teacher | null {
    if (!token) return null;
    const [payload, sig, extra] = token.split('.');
    if (!payload || !sig || extra !== undefined) return null;
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    try {
      const { sub, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub: string; exp: number };
      if (typeof exp !== 'number' || exp * 1000 < now()) return null;
      return db.teachers.find((t) => t.id === sub) ?? null;
    } catch {
      return null;
    }
  }

  function validateNew(usernameRaw: unknown, passwordRaw: unknown, nameRaw: unknown) {
    const username = typeof usernameRaw === 'string' ? usernameRaw.trim().toLowerCase() : '';
    const password = typeof passwordRaw === 'string' ? passwordRaw : '';
    const name = typeof nameRaw === 'string' ? nameRaw.replace(/\s+/g, ' ').trim() : '';
    if (!USERNAME.test(username)) throw new HttpError(400, 'username: 3 to 30 letters, digits, dots, dashes or underscores');
    if (password.length < 6 || password.length > 100) throw new HttpError(400, 'password: 6 to 100 characters');
    if (name.length < 1 || name.length > 60) throw new HttpError(400, 'name: 1 to 60 characters');
    return { username, password, name };
  }

  function register(usernameRaw: unknown, passwordRaw: unknown, nameRaw: unknown) {
    const { username, password, name } = validateNew(usernameRaw, passwordRaw, nameRaw);
    if (db.teachers.some((t) => t.username === username)) throw new HttpError(409, 'that username is taken');
    if (db.teachers.length >= max) throw new HttpError(503, 'this server cannot take more teacher accounts');
    const salt = randomBytes(16).toString('hex');
    const teacher: Teacher = { id: randomBytes(8).toString('hex'), username, name, salt, hash: hashPassword(password, salt), createdAt: now() };
    db.teachers.push(teacher);
    save();
    return { token: issue(teacher), teacher: publicTeacher(teacher) };
  }

  function login(usernameRaw: unknown, passwordRaw: unknown) {
    const username = typeof usernameRaw === 'string' ? usernameRaw.trim().toLowerCase() : '';
    const password = typeof passwordRaw === 'string' ? passwordRaw.slice(0, 200) : '';
    const teacher = db.teachers.find((t) => t.username === username);
    const hash = hashPassword(password, teacher?.salt ?? dummySalt);
    const ok = teacher && timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(teacher.hash, 'hex'));
    if (!teacher || !ok) throw new HttpError(401, 'wrong username or password');
    return { token: issue(teacher), teacher: publicTeacher(teacher) };
  }

  /** A ready-made teacher for trying the portal. Only made when the server asks for it. */
  function seedDemo(username: string, password: string, name: string) {
    if (db.teachers.some((t) => t.username === username)) return false;
    register(username, password, name);
    return true;
  }

  return { register, login, verify, seedDemo, count: () => db.teachers.length };
}

export type Accounts = ReturnType<typeof createAccounts>;
