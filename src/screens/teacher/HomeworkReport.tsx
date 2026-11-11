import { useMemo, useState } from 'react';
import { subjects, topicById } from '../../../shared/curriculum/index.ts';
import { g4Homework, g4Quiz } from '../../../shared/lessons/g4Fractions.ts';
import { g7Misconceptions, g7Quiz, g7Skills } from '../../../shared/lessons/g7Linear.ts';
import { buildTeacherReport, type LessonReport, type PracticeReport, type ReportStudent, type StoredEntry } from '../../../shared/report.ts';
import { tx, type Lang, type QuizQuestion, type Text } from '../../../shared/types.ts';
import { MathLabel } from '../../components/Brand.tsx';
import { VisualView } from '../../components/FractionVisuals.tsx';
import type { TeacherReportResult } from '../../lib/api.ts';
import { telegram } from '../../lib/telegram.ts';

/*
 * "Uy vazifasi": every student's answers per question, re-checked on the server.
 * Real data only for teachers listed on the server (TEACHER_IDS); everyone else sees fictional sample data, labelled.
 */

const L = {
  title: { uz: 'Uy vazifasi', ru: 'Домашнее задание', en: 'Homework' },
  live: { uz: 'Haqiqiy natijalar', ru: 'Реальные результаты', en: 'Live results' },
  demo: { uz: 'Namunaviy ma’lumotlar', ru: 'Демо-данные', en: 'Demo data' },
  g7: { uz: '7-sinf · Chiziqli funksiya', ru: '7 класс · Линейная функция', en: 'Grade 7 · Linear function' },
  g4: { uz: '4-sinf · Kasrlar', ru: '4 класс · Дроби', en: 'Grade 4 · Fractions' },
  gradeTab: { uz: '{n}-sinf', ru: '{n} класс', en: 'Grade {n}' },
  summary: {
    uz: '{n} o‘quvchi · o‘rtacha {avg}/{total} · avtomatik tekshirildi',
    ru: 'Учеников: {n} · в среднем {avg}/{total} · проверено автоматически',
    en: '{n} students · average {avg}/{total} · checked automatically',
  },
  student: { uz: 'O‘quvchi', ru: 'Ученик', en: 'Student' },
  unnamed: { uz: 'O‘quvchi {n}', ru: 'Ученик {n}', en: 'Student {n}' },
  you: { uz: 'siz', ru: 'вы', en: 'you' },
  score: { uz: 'Ball', ru: 'Балл', en: 'Score' },
  wrongRow: { uz: 'Xatolar', ru: 'Ошибок', en: 'Wrong' },
  mostMissed: {
    uz: 'Eng ko‘p xato: Q{q} · {topic} — {n} ta o‘quvchida. Darsni shundan boshlang.',
    ru: 'Чаще всего ошибались: Q{q} · {topic} — {n} уч. С этого стоит начать урок.',
    en: 'Most missed: Q{q} · {topic}, by {n} students. Start the lesson here.',
  },
  noneMissed: { uz: 'Hamma savollarga to‘g‘ri javob berildi.', ru: 'На все вопросы ответили верно.', en: 'Every question was answered correctly.' },
  tapHint: { uz: 'Xatolarini ko‘rish uchun o‘quvchini bosing.', ru: 'Нажмите на ученика, чтобы увидеть его ошибки.', en: 'Tap a student to see their wrong answers.' },
  chose: { uz: 'Javobi', ru: 'Ответ', en: 'Answered' },
  right: { uz: 'To‘g‘ri', ru: 'Верно', en: 'Correct' },
  allRight: { uz: 'Testdagi hamma javoblar to‘g‘ri.', ru: 'Все ответы в тесте верные.', en: 'All quiz answers are correct.' },
  noQuiz: { uz: 'Testni hali topshirmagan.', ru: 'Тест ещё не сдан.', en: 'Has not taken the quiz yet.' },
  skipped: { uz: 'Javobsiz: {list}', ru: 'Без ответа: {list}', en: 'Not answered: {list}' },
  problem: { uz: 'Yo‘naltirilgan masala', ru: 'Задача с подсказками', en: 'Guided problem' },
  problemN: { uz: '{n}-masala', ru: 'Задача {n}', en: 'Problem {n}' },
  notStarted: { uz: 'boshlanmagan', ru: 'не начата', en: 'not started' },
  solved: { uz: 'yechildi', ru: 'решена', en: 'solved' },
  unsolved: { uz: 'hali yechilmagan', ru: 'ещё не решена', en: 'not solved yet' },
  tries: { uz: '{n} ta xato urinish', ru: 'неверных попыток: {n}', en: '{n} wrong tries' },
  hints: { uz: '{n} ta maslahat', ru: 'подсказок: {n}', en: '{n} hints' },
  loading: { uz: 'Natijalar yuklanmoqda…', ru: 'Загружаем результаты…', en: 'Loading results…' },
  sampleNotTeacher: {
    uz: 'Haqiqiy hisobot faqat ro‘yxatdagi o‘qituvchilarga ko‘rinadi. Quyida — namuna.',
    ru: 'Реальный отчёт видят только учителя из списка. Ниже — пример.',
    en: 'Only listed teachers see the real report. Below is a sample.',
  },
  sampleEmpty: {
    uz: 'Hali hech kim testni topshirmagan. Quyida — namuna.',
    ru: 'Пока никто не сдал тест. Ниже — пример.',
    en: 'No student has taken the quiz yet. Below is a sample.',
  },
  sampleOffline: {
    uz: 'Hisobotni hozir ochib bo‘lmadi. Quyida — namuna.',
    ru: 'Отчёт сейчас недоступен. Ниже — пример.',
    en: 'The report could not be opened right now. Below is a sample.',
  },
  practiceTitle: { uz: 'Darslik mashqlari', ru: 'Упражнения по учебнику', en: 'Textbook practice' },
  practiceExplain: {
    uz: 'Telegram chati va ilovadagi 6–7-sinf mashqlari. Foiz — birinchi urinishda berilgan to‘g‘ri javoblar.',
    ru: 'Упражнения 6–7 классов в чате Telegram и в приложении. Процент — верные ответы с первой попытки.',
    en: 'Grade 6–7 practice in the Telegram chat and the app. Percent means answers right on the first try.',
  },
  practiceSummary: { uz: 'O‘quvchilar: {n} · savollar: {q}', ru: 'Учеников: {n} · вопросов: {q}', en: 'Students: {n} · questions: {q}' },
  practiceTopics: { uz: 'Mavzu', ru: 'Темы', en: 'Topics' },
  practiceQuestions: { uz: 'Savol', ru: 'Вопросы', en: 'Questions' },
  practiceFirstTry: { uz: '1-urinish', ru: '1-я попытка', en: '1st try' },
  practiceWeakest: { uz: 'Eng zaif: {topic} · {p}%', ru: 'Слабее всего: {topic} · {p}%', en: 'Weakest: {topic} · {p}%' },
  practiceByTopic: { uz: 'Mavzular bo‘yicha', ru: 'По темам', en: 'By topic' },
  practiceAverage: { uz: 'O‘rtacha', ru: 'Среднее', en: 'Average' },
  practiceStudents: { uz: 'O‘quvchi', ru: 'Ученики', en: 'Students' },
  practiceHot: {
    uz: 'Eng zaif mavzu: {topic} — birinchi urinishda o‘rtacha {p}%. Shu mavzuni darsda takrorlang.',
    ru: 'Самая слабая тема: {topic} — в среднем {p}% с первой попытки. Стоит повторить её на уроке.',
    en: 'Weakest topic: {topic}, {p}% on the first try on average. Worth revisiting in class.',
  },
  practiceAllRight: { uz: 'Hamma javoblar birinchi urinishda to‘g‘ri.', ru: 'Все ответы верны с первой попытки.', en: 'Every answer was right on the first try.' },
  sampleNoPractice: {
    uz: 'Hali hech kim mashq qilmagan. Quyida — namuna.',
    ru: 'Пока никто не занимался. Ниже — пример.',
    en: 'No student has practised yet. Below is a sample.',
  },
} satisfies Record<string, Text>;

/** Grade 4 quiz topics (the quiz has no per-question skill names). */
const G4_TOPIC: Text[] = [
  { uz: 'Kasrni nomlash', ru: 'Называем дробь', en: 'Naming a fraction' },
  { uz: 'Teng bo‘laklar', ru: 'Равные части', en: 'Equal parts' },
  { uz: 'Taqqoslash', ru: 'Сравнение', en: 'Comparing' },
  { uz: 'Bo‘yalmagan qism', ru: 'Незакрашенная часть', en: 'The uncolored part' },
  { uz: 'Matnli masala', ru: 'Текстовая задача', en: 'Word problem' },
];

const QUIZ: Record<LessonReport['lessonId'], QuizQuestion[]> = { 'g7-linear': g7Quiz, 'g4-fractions': g4Quiz };

function topicOf(lesson: LessonReport, i: number): Text {
  if (lesson.lessonId === 'g4-fractions') return G4_TOPIC[i] ?? { uz: '', ru: '', en: '' };
  const skill = g7Skills.find((s) => s.id === g7Quiz[i]?.skill);
  return skill?.name ?? { uz: '', ru: '', en: '' };
}

/* ---------- fictional sample, built by the same code as the real report ---------- */

function sampleLesson(): LessonReport {
  const quiz = (last: Record<string, string>) => ({ best: null, last, attempts: 1 });
  const g7 = (name: string, last: Record<string, string>, problem: { solved: boolean; wrong: number; hints: number }): StoredEntry => ({
    name,
    updatedAt: 1,
    progress: { acad: { quiz: quiz(last), problem } },
  });
  const all = { g7q1: 'b', g7q2: 'c', g7q3: 'c', g7q4: 'a', g7q5: 'a', g7q6: 'd' };
  const entries: Record<string, StoredEntry> = {
    '1': g7('Aziza R.', all, { solved: true, wrong: 0, hints: 0 }),
    '2': g7('Bobur T.', { ...all, g7q4: 'b' }, { solved: true, wrong: 1, hints: 1 }),
    '3': g7('Dilnoza K.', { ...all, g7q3: 'b', g7q4: 'b' }, { solved: true, wrong: 3, hints: 2 }),
    '4': g7('Eldor S.', { ...all, g7q2: 'b', g7q4: 'c', g7q6: 'c' }, { solved: false, wrong: 2, hints: 3 }),
    '5': g7('Farrux M.', { ...all, g7q6: 'a' }, { solved: true, wrong: 0, hints: 1 }),
  };
  return buildTeacherReport(entries, null, 0).lessons[0];
}

function samplePractice(): PracticeReport {
  const t = (answered: number, right: number) => ({ answered, right, stars: 1, rounds: 1, lastAt: 1 });
  const student = (name: string, topics: Record<string, ReturnType<typeof t>>): StoredEntry => ({ name, updatedAt: 1, progress: { bot: { topics } } });
  const entries: Record<string, StoredEntry> = {
    '1': student('Aziza R.', { 'a7-eq': t(10, 9), 'a7-power': t(5, 5), 'g7-tri': t(5, 4) }),
    '2': student('Bobur T.', { 'a7-eq': t(5, 3), 'a7-fsu': t(5, 2) }),
    '3': student('Dilnoza K.', { 'a7-eq': t(10, 7), 'a7-fsu': t(5, 1), 'f7-ohm': t(5, 3) }),
    '4': student('Eldor S.', { 'a7-power': t(5, 4), 'f7-ohm': t(5, 2) }),
    '5': student('Farrux M.', { 'a7-eq': t(5, 5), 'g7-tri': t(5, 3) }),
  };
  return buildTeacherReport(entries, null, 0).practice;
}

/* ---------- view ---------- */

type Fill = (k: keyof typeof L, vars?: Record<string, string | number>) => string;

export function HomeworkReport({ result, lang }: { result: TeacherReportResult | null; lang: Lang }) {
  const s: Fill = (k, vars) => {
    let out = tx(L[k], lang);
    if (vars) for (const [key, v] of Object.entries(vars)) out = out.split(`{${key}}`).join(String(v));
    return out;
  };
  return (
    <>
      <HomeworkPanel result={result} s={s} lang={lang} />
      {result !== null && <PracticePanel result={result} s={s} lang={lang} />}
    </>
  );
}

function HomeworkPanel({ result, s, lang }: { result: TeacherReportResult | null; s: Fill; lang: Lang }) {
  const real = result?.status === 'ok' ? result.report.lessons.filter((l) => l.students.length > 0) : [];
  const sample = useMemo(sampleLesson, []);
  const live = real.length > 0;
  const lessons = live ? real : [sample];
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const lesson = lessons.find((l) => l.lessonId === lessonId) ?? lessons[0];

  const sampleWhy =
    result === null ? null : result.status === 'not-teacher' ? 'sampleNotTeacher' : result.status === 'unavailable' ? 'sampleOffline' : 'sampleEmpty';

  return (
    <section className="panel hw-panel">
      <div className="panel-row">
        <h2 className="panel-title"><i className="sys-dot" style={{ background: '#0F8A72' }} />{s('title')}</h2>
        {result !== null && (live ? (
          <span className="tag-live"><span className="live-dot" />{s('live')}</span>
        ) : (
          <span className="tag-demo small">{s('demo')}</span>
        ))}
      </div>

      {result === null ? (
        <p className="panel-sub hw-loading">{s('loading')}</p>
      ) : (
        <>
          {!live && sampleWhy && <p className="panel-sub">{s(sampleWhy)}</p>}
          {lessons.length > 1 && (
            <div className="hw-tabs" role="tablist">
              {lessons.map((l) => (
                <button
                  key={l.lessonId}
                  role="tab"
                  aria-selected={l === lesson}
                  className={l === lesson ? 'on' : ''}
                  onClick={() => {
                    telegram.haptic('select');
                    setLessonId(l.lessonId);
                    setOpen(null);
                  }}
                >
                  {s('gradeTab', { n: l.grade })}
                </button>
              ))}
            </div>
          )}
          <p className="hw-meta">
            <b>{s(lesson.lessonId === 'g7-linear' ? 'g7' : 'g4')}</b>
            {lesson.averageScore !== null && (
              <span>{s('summary', { n: lesson.students.length, avg: String(lesson.averageScore).replace('.', lang === 'en' ? '.' : ','), total: lesson.questions.length })}</span>
            )}
          </p>
          <Grid lesson={lesson} open={open} setOpen={setOpen} s={s} lang={lang} />
          {lesson.mostMissed !== null ? (
            <div className="act act-coral hw-hot">
              {s('mostMissed', { q: lesson.mostMissed + 1, topic: tx(topicOf(lesson, lesson.mostMissed), lang), n: lesson.wrongCount[lesson.mostMissed] })}
            </div>
          ) : (
            lesson.averageScore !== null && <p className="panel-sub">{s('noneMissed')}</p>
          )}
          <p className="panel-sub">{s('tapHint')}</p>
        </>
      )}
    </section>
  );
}

/** Has its own "live" or "sample" label: a class can have real practice and no quiz yet, or the other way round. */
function PracticePanel({ result, s, lang }: { result: TeacherReportResult; s: Fill; lang: Lang }) {
  const sample = useMemo(samplePractice, []);
  // A server still running older code sends a report without practice: that shows the sample, never a crash.
  const real = result.status === 'ok' ? (result.report.practice as PracticeReport | undefined) : undefined;
  const live = Boolean(real && real.students.length > 0);
  const practice = live ? real! : sample;
  const sampleWhy = result.status === 'not-teacher' ? 'sampleNotTeacher' : real ? 'sampleNoPractice' : 'sampleOffline';
  const studentCols = { gridTemplateColumns: 'minmax(0, 1fr) 42px 58px 56px' };
  const topicCols = { gridTemplateColumns: 'minmax(0, 1fr) 58px 56px' };
  const title = (id: string) => {
    const topic = topicById(id);
    return topic ? tx(topic.title, lang) : '';
  };
  const hot = practice.topics.find((t) => t.topicId === practice.weakestTopicId);
  let unnamed = 0;
  return (
    <section className="panel hw-panel">
      <div className="panel-row">
        <h2 className="panel-title"><i className="sys-dot" style={{ background: '#0F8A72' }} />{s('practiceTitle')}</h2>
        {live ? (
          <span className="tag-live"><span className="live-dot" />{s('live')}</span>
        ) : (
          <span className="tag-demo small">{s('demo')}</span>
        )}
      </div>
      {!live && <p className="panel-sub">{s(sampleWhy)}</p>}
      <p className="hw-meta">
        <b>{s('practiceSummary', { n: practice.students.length, q: practice.answered })}</b>
        <span>{s('practiceExplain')}</span>
      </p>

      <div className="hw-grid">
        <div className="hw-row hw-th" style={studentCols} aria-hidden="true">
          <span>{s('student')}</span>
          <span>{s('practiceTopics')}</span>
          <span>{s('practiceQuestions')}</span>
          <span className="hw-sc">{s('practiceFirstTry')}</span>
        </div>
        {practice.students.map((st) => {
          const name = st.name ?? s('unnamed', { n: ++unnamed });
          return (
            <div key={st.key} className="hw-row hw-num" style={studentCols}>
              <span className="hw-who">
                <b className="hw-name">{name}{st.self && <em> ({s('you')})</em>}</b>
                {st.weakest && <small>{s('practiceWeakest', { topic: title(st.weakest.topicId), p: st.weakest.percent })}</small>}
              </span>
              <span>{st.topics}</span>
              <span>{st.answered}</span>
              <span className="hw-sc">{st.percent}%</span>
            </div>
          );
        })}
      </div>

      <div className="hw-grid">
        <div className="hw-row hw-th" style={topicCols} aria-hidden="true">
          <span>{s('practiceByTopic')}</span>
          <span>{s('practiceStudents')}</span>
          <span className="hw-sc">{s('practiceAverage')}</span>
        </div>
        {practice.topics.map((t) => {
          const topic = topicById(t.topicId);
          const subject = subjects.find((x) => x.id === topic?.subject);
          return (
            <div key={t.topicId} className={`hw-row hw-num ${t.topicId === practice.weakestTopicId ? 'hw-row-hot' : ''}`} style={topicCols}>
              <span className="hw-who">
                <b>{title(t.topicId)}</b>
                {topic && subject && <small>{s('gradeTab', { n: topic.grade })} · {tx(subject.title, lang)}</small>}
              </span>
              <span>{t.students}</span>
              <span className="hw-sc">{t.averagePercent}%</span>
            </div>
          );
        })}
      </div>

      {hot ? (
        <div className="act act-coral hw-hot">{s('practiceHot', { topic: title(hot.topicId), p: hot.averagePercent })}</div>
      ) : (
        <p className="panel-sub">{s('practiceAllRight')}</p>
      )}
    </section>
  );
}

function Grid({ lesson, open, setOpen, s, lang }: { lesson: LessonReport; open: string | null; setOpen: (k: string | null) => void; s: Fill; lang: Lang }) {
  const cols = { gridTemplateColumns: `minmax(0, 1fr) repeat(${lesson.questions.length}, 26px) 42px` };
  const hot = lesson.mostMissed;
  let unnamed = 0;
  return (
    <div className="hw-grid">
      <div className="hw-row hw-th" style={cols} aria-hidden="true">
        <span>{s('student')}</span>
        {lesson.questions.map((id, i) => (
          <span key={id} className={i === hot ? 'hot' : ''}>Q{i + 1}</span>
        ))}
        <span className="hw-sc">{s('score')}</span>
      </div>
      {lesson.students.map((st) => {
        const name = st.name ?? s('unnamed', { n: ++unnamed });
        const isOpen = open === st.key;
        return (
          <div key={st.key} className={`hw-student ${isOpen ? 'open' : ''}`}>
            <button
              className="hw-row"
              style={cols}
              aria-expanded={isOpen}
              aria-label={`${name}: ${st.score === null ? '—' : `${st.score}/${lesson.questions.length}`}. ${st.marks.map((m, i) => `Q${i + 1} ${m === true ? '✓' : m === false ? '✗' : '—'}`).join(', ')}`}
              onClick={() => {
                telegram.haptic('select');
                setOpen(isOpen ? null : st.key);
              }}
            >
              <b className="hw-name">{name}{st.self && <em> ({s('you')})</em>}</b>
              {st.marks.map((m, i) => (
                <span key={i} className={i === hot ? 'hot' : ''}>
                  <i className={`hw-mk ${m === true ? 'ok' : m === false ? 'x' : 'none'}`}>
                    {m === true ? '✓' : m === false ? '✗' : '·'}
                  </i>
                </span>
              ))}
              <span className="hw-sc">{st.score === null ? '—' : `${st.score}/${lesson.questions.length}`}</span>
            </button>
            {isOpen && <Detail lesson={lesson} st={st} s={s} lang={lang} />}
          </div>
        );
      })}
      <div className="hw-row hw-cls" style={cols}>
        <b>{s('wrongRow')}</b>
        {lesson.wrongCount.map((n, i) => (
          <span key={i} className={i === hot ? 'hot' : ''}>{n}</span>
        ))}
        <span className="hw-sc">{lesson.averageScore === null ? '—' : String(lesson.averageScore).replace('.', lang === 'en' ? '.' : ',')}</span>
      </div>
    </div>
  );
}

function ChoiceView({ q, id, lang }: { q: QuizQuestion; id: string; lang: Lang }) {
  const c = q.choices.find((x) => x.id === id);
  if (!c) return null;
  if (c.visual) return <span className="hw-choice-pic"><VisualView visual={c.visual} lang={lang} size={c.visual.type === 'line' ? 56 : 48} /></span>;
  return <b className="hw-choice"><MathLabel text={c.label ? tx(c.label, lang) : ''} /></b>;
}

function Detail({ lesson, st, s, lang }: { lesson: LessonReport; st: ReportStudent; s: Fill; lang: Lang }) {
  const quiz = QUIZ[lesson.lessonId];
  const wrong = st.marks.flatMap((m, i) => (m === false ? [i] : []));
  const skipped = st.score === null ? [] : st.marks.flatMap((m, i) => (m === null ? [`Q${i + 1}`] : []));
  return (
    <div className="hw-detail">
      {st.score === null ? (
        <p>{s('noQuiz')}</p>
      ) : wrong.length === 0 ? (
        <p className="hw-allright">✓ {s('allRight')}</p>
      ) : (
        <ul className="hw-wrong">
          {wrong.map((i) => {
            const q = quiz[i];
            const chosen = q.choices.find((c) => c.id === st.answers[i]);
            const mis = lesson.lessonId === 'g7-linear' ? g7Misconceptions.find((m) => m.id === chosen?.misconception) : undefined;
            return (
              <li key={q.id}>
                <span className="hw-q">Q{i + 1} · {tx(topicOf(lesson, i), lang)}</span>
                <span className="hw-ans">
                  <small>{s('chose')}</small> <ChoiceView q={q} id={st.answers[i]!} lang={lang} />
                  <small>{s('right')}</small> <ChoiceView q={q} id={q.correct} lang={lang} />
                </span>
                {mis && <span className="hw-mis">{tx(mis.name, lang)}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {skipped.length > 0 && <p className="hw-skipped">{s('skipped', { list: skipped.join(', ') })}</p>}
      <ul className="hw-problems">
        {st.problems.map((p, i) => {
          const label = lesson.lessonId === 'g4-fractions' && g4Homework.length > 1 ? s('problemN', { n: i + 1 }) : s('problem');
          const parts = !p.started
            ? [s('notStarted')]
            : [p.solved ? s('solved') : s('unsolved'), s('tries', { n: p.wrong }), s('hints', { n: p.hints })];
          return (
            <li key={p.id} className={p.solved ? 'ok' : p.started ? 'open' : ''}>
              <b>{label}</b> {parts.join(' · ')}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
