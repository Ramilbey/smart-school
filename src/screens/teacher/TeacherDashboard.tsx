import { useEffect, useState } from 'react';
import { g4Quiz } from '../../../shared/lessons/g4Fractions.ts';
import { tx, type Text } from '../../../shared/types.ts';
import { Icon, TopBar } from '../../components/Chrome.tsx';
import { fetchTeacherReport, type TeacherReportResult } from '../../lib/api.ts';
import { useNav } from '../../lib/nav.tsx';
import { useStore } from '../../lib/store.tsx';
import { telegram } from '../../lib/telegram.ts';
import { HomeworkReport } from './HomeworkReport.tsx';

/* Numbers and names on this screen are fictional demo data, and the screen says so.
   The exception is the homework report, which shows real results to teachers listed on the server. */

const ROSTER = [
  'Aziza R.', 'Bobur T.', 'Dilnoza K.', 'Eldor S.', 'Farrux M.', 'Gulnora A.', 'Hasan B.',
  'Iroda Y.', 'Jasur N.', 'Kamola O.', 'Laylo X.', 'Madina U.', 'Nodir E.', 'Oysha I.',
  'Parizod Z.', 'Rustam Q.', 'Sardor V.', 'Shahzoda L.', 'Temur G.', 'Umida F.', 'Vali D.',
  'Xurshid P.', 'Yulduz H.', 'Zarina J.', 'Asal C.', 'Bekzod W.', 'Diyor R.', 'Feruza S.',
];
const EXPECTED = ROSTER.length;
const CAMERA_ESTIMATE = 26;
const DEMO_ACCURACY = [88, 64, 79, 58, 72];
const QUESTION_TOPIC: Text[] = [
  { uz: 'Kasrni nomlash', ru: 'Называем дробь', en: 'Naming a fraction' },
  { uz: 'Teng bo‘laklar', ru: 'Равные части', en: 'Equal parts' },
  { uz: 'Taqqoslash', ru: 'Сравнение', en: 'Comparing' },
  { uz: 'Bo‘yalmagan qism', ru: 'Незакрашенная часть', en: 'The uncolored part' },
  { uz: 'Matnli masala', ru: 'Текстовая задача', en: 'Word problem' },
];

const L = {
  title: { uz: 'O‘qituvchi paneli', ru: 'Панель учителя', en: 'Teacher dashboard' },
  demo: { uz: 'Namunaviy ma’lumotlar', ru: 'Демо-данные', en: 'Demo data' },
  demoNote: {
    uz: 'Bu ekrandagi barcha ism va raqamlar o‘ylab topilgan. Haqiqiy maktab tizimiga ulanmagan.',
    ru: 'Все имена и цифры на этом экране вымышлены. Подключения к реальной школьной системе нет.',
    en: 'All names and numbers on this screen are fictional. It is not connected to a real school system.',
  },
  demoNoteMixed: {
    uz: '«Haqiqiy natijalar» belgisi bor bo‘limlarda — o‘quvchilaringizning haqiqiy natijalari. Boshqa bo‘limlardagi ism va raqamlar o‘ylab topilgan.',
    ru: 'В разделах с пометкой «Реальные результаты» — настоящие результаты ваших учеников. Имена и цифры в остальных разделах вымышлены.',
    en: 'Sections marked “Live results” show your students’ real results. Names and numbers in the other sections are fictional.',
  },
  classLine: { uz: '4-B sinf · Matematika · Kasrlar', ru: '4-Б класс · Математика · Дроби', en: 'Class 4-B · Mathematics · Fractions' },
  attendance: { uz: 'Aqlli davomat', ru: 'Умная посещаемость', en: 'Smart Attendance' },
  expected: { uz: 'Ro‘yxat bo‘yicha', ru: 'По списку', en: 'Expected' },
  camera: { uz: 'Kamera hisobi', ru: 'Оценка камеры', en: 'Camera estimate' },
  simulated: { uz: 'namunaviy', ru: 'смоделировано', en: 'simulated' },
  marked: { uz: 'Yo‘q deb belgilangan', ru: 'Отмечено отсутствующих', en: 'Marked absent' },
  cameraExplain: {
    uz: 'Kamera faqat odamlar sonini taxmin qiladi, kimligini aniqlamaydi. Kelmagan o‘quvchilarni o‘zingiz belgilang va tasdiqlang.',
    ru: 'Камера только оценивает количество людей и не определяет, кто это. Отметьте отсутствующих и подтвердите.',
    en: 'The camera only estimates how many people are present; it does not identify anyone. Mark who is absent and confirm.',
  },
  mismatch: {
    uz: 'Kamera {n} nafar o‘quvchi yo‘qligini taxmin qilmoqda, siz {m} nafarni belgiladingiz. Iltimos, tekshirib ko‘ring — taxmin xato bo‘lishi mumkin.',
    ru: 'По оценке камеры отсутствуют {n}, а отмечено {m}. Проверьте, пожалуйста: оценка может ошибаться.',
    en: 'The camera estimate suggests {n} absent, but {m} are marked. Please double-check: the estimate can be wrong.',
  },
  confirm: { uz: 'Davomatni tasdiqlash', ru: 'Подтвердить посещаемость', en: 'Confirm attendance' },
  confirmed: {
    uz: 'Tasdiqlandi, {time} · faqat shu qurilmada saqlandi (demo)',
    ru: 'Подтверждено в {time} · сохранено только на этом устройстве (демо)',
    en: 'Confirmed at {time} · saved on this device only (demo)',
  },
  edit: { uz: 'O‘zgartirish', ru: 'Изменить', en: 'Edit' },
  assessment: { uz: 'Aqlli baholash', ru: 'Умная оценка', en: 'Smart Assessment' },
  accuracy: { uz: 'Dars oxiridagi test: to‘g‘ri javoblar', ru: 'Тест в конце урока: верные ответы', en: 'End-of-lesson quiz: correct answers' },
  perQuestion: { uz: 'Savollar bo‘yicha', ru: 'По вопросам', en: 'By question' },
  device: { uz: 'Shu qurilmadagi test (haqiqiy)', ru: 'Тест на этом устройстве (реальный)', en: 'Quiz on this device (live)' },
  deviceNone: {
    uz: '4-sinf testini yeching — natijangiz shu yerda haqiqiy ma’lumot sifatida ko‘rinadi.',
    ru: 'Пройдите тест 4 класса — ваш результат появится здесь как реальные данные.',
    en: 'Take the Grade 4 quiz and your result appears here as live data.',
  },
  followUp: { uz: 'Tavsiya etilgan keyingi qadam', ru: 'Рекомендуемый следующий шаг', en: 'Suggested follow-up' },
  followText: {
    uz: '“Bo‘yalmagan qism” savoli — 58%. Ko‘p o‘quvchilar bo‘yalgan qismni sanagan. «Kasr yasaymiz» vizual mashqi bilan 8 daqiqalik takrorlash tavsiya etiladi.',
    ru: 'Вопрос «Незакрашенная часть» — 58%. Многие посчитали закрашенную часть. Рекомендуется 8-минутное повторение с наглядным заданием «Собираем дробь».',
    en: '“The uncolored part” question: 58%. Many students counted the colored part instead. Suggested: an 8-minute recap with the “Build a fraction” visual.',
  },
  followText2: {
    uz: '“Teng bo‘laklar” — 64%. Uyga vazifa sifatida maslahatli 2 ta masala yuborish mumkin.',
    ru: '«Равные части» — 64%. Можно задать на дом 2 задачи с подсказками.',
    en: '“Equal parts”: 64%. Assign the 2 hint-ladder homework problems.',
  },
  review: { uz: 'AI kontentini tekshirish', ru: 'Проверка ИИ-материалов', en: 'AI content review' },
  reviewNote: {
    uz: 'Prototipda tasdiqlash faqat shu qurilmadagi belgini o‘zgartiradi; o‘quvchi ilovasidagi “qoralama” belgisi saqlanib qoladi.',
    ru: 'В прототипе одобрение меняет только отметку на этом устройстве; в приложении ученика остаётся пометка «черновик».',
    en: 'In the prototype, approving only changes the label on this device; the student app keeps its “draft” label.',
  },
  approve: { uz: 'Tasdiqlash', ru: 'Одобрить', en: 'Approve' },
  flag: { uz: 'Xato bor', ru: 'Есть ошибка', en: 'Flag' },
  draft: { uz: 'Qoralama · tekshiruv kutilmoqda', ru: 'Черновик · ждёт проверки', en: 'Draft · awaiting review' },
  approved: { uz: 'Tasdiqlandi (demo)', ru: 'Одобрено (демо)', en: 'Approved (demo)' },
  flagged: { uz: 'Tuzatishga yuborildi (demo)', ru: 'Отправлено на исправление (демо)', en: 'Flagged for correction (demo)' },
  undo: { uz: 'Bekor qilish', ru: 'Отменить', en: 'Undo' },
} satisfies Record<string, Text>;

const REVIEW_ITEMS: { id: string; title: Text }[] = [
  { id: 'g4-uz', title: { uz: '4-sinf · Kasrlar · o‘zbekcha matn va maslahatlar', ru: '4 класс · Дроби · узбекский текст и подсказки', en: 'Grade 4 · Fractions · Uzbek text and hints' } },
  { id: 'g4-ru', title: { uz: '4-sinf · Kasrlar · ruscha matn va maslahatlar', ru: '4 класс · Дроби · русский текст и подсказки', en: 'Grade 4 · Fractions · Russian text and hints' } },
  { id: 'g7-uz', title: { uz: '7-sinf · Chiziqli funksiya · o‘zbekcha', ru: '7 класс · Линейная функция · узбекский', en: 'Grade 7 · Linear function · Uzbek' } },
  { id: 'g7-ru', title: { uz: '7-sinf · Chiziqli funksiya · ruscha', ru: '7 класс · Линейная функция · русский', en: 'Grade 7 · Linear function · Russian' } },
];

export function TeacherDashboard() {
  const { lang, progress, update, t } = useStore();
  const nav = useNav();
  const s = (k: keyof typeof L, vars?: Record<string, string | number>) => {
    let out = tx(L[k], lang);
    if (vars) for (const [key, v] of Object.entries(vars)) out = out.split(`{${key}}`).join(String(v));
    return out;
  };
  const confirmedAt = progress.teacher.confirmedAt;
  const [absent, setAbsent] = useState<string[]>(progress.teacher.absent ?? []);
  const [editing, setEditing] = useState(!confirmedAt);
  const estimateAbsent = EXPECTED - CAMERA_ESTIMATE;
  const mean = Math.round(DEMO_ACCURACY.reduce((a, b) => a + b, 0) / DEMO_ACCURACY.length);
  const myAnswers = progress.kids.quiz.last;
  const [report, setReport] = useState<TeacherReportResult | null>(null);
  const liveReport = report?.status === 'ok' && (report.report.lessons.some((l) => l.students.length > 0) || (report.report.practice?.students.length ?? 0) > 0);

  useEffect(() => {
    let cancelled = false;
    void fetchTeacherReport().then((r) => !cancelled && setReport(r));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (name: string) => {
    if (!editing) return;
    telegram.haptic('select');
    setAbsent((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));
  };

  return (
    <main className="screen teacher">
      <TopBar title={s('title')} subtitle={s('classLine')} />
      <div className="scroll">
        <div className="demo-banner" role="note">
          <span className="tag-demo">{s('demo')}</span>
          <p>{s(liveReport ? 'demoNoteMixed' : 'demoNote')}</p>
        </div>

        <HomeworkReport result={report} lang={lang} />

        <section className="panel">
          <div className="panel-row">
            <h2 className="panel-title"><i className="sys-dot" style={{ background: '#2DE2C4' }} />{s('attendance')}</h2>
            <span className="tag-demo small">{s('demo')}</span>
          </div>
          <div className="kpis">
            <div className="kpi"><small>{s('expected')}</small><b>{EXPECTED}</b></div>
            <div className="kpi"><small>{s('camera')} <em>({s('simulated')})</em></small><b>{CAMERA_ESTIMATE}</b></div>
            <div className="kpi"><small>{s('marked')}</small><b className={absent.length !== estimateAbsent ? 'warn' : ''}>{absent.length}</b></div>
          </div>
          <p className="panel-sub">{s('cameraExplain')}</p>
          <div className={`roster ${editing ? '' : 'locked'}`} role="group" aria-label={s('attendance')}>
            {ROSTER.map((name) => (
              <button key={name} className={`roster-item ${absent.includes(name) ? 'absent' : ''}`} aria-pressed={absent.includes(name)} onClick={() => toggle(name)} disabled={!editing}>
                {name}
              </button>
            ))}
          </div>
          {editing && absent.length !== estimateAbsent && <p className="warn-box">{s('mismatch', { n: estimateAbsent, m: absent.length })}</p>}
          {editing ? (
            <button
              className="btn btn-teacher btn-block"
              onClick={() => {
                update((p) => {
                  p.teacher.absent = absent;
                  p.teacher.confirmedAt = Date.now();
                });
                setEditing(false);
                telegram.haptic('success');
              }}
            >
              {s('confirm')}
            </button>
          ) : (
            <div className="confirmed-row">
              <p>{Icon.check} {s('confirmed', { time: new Date(confirmedAt ?? Date.now()).toLocaleTimeString(lang === 'en' ? 'en-GB' : lang === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' }) })}</p>
              <button className="btn btn-outline" onClick={() => setEditing(true)}>{s('edit')}</button>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-row">
            <h2 className="panel-title"><i className="sys-dot" style={{ background: '#5B8CFF' }} />{s('assessment')}</h2>
            <span className="tag-demo small">{s('demo')}</span>
          </div>
          <div className="big-stat">
            <b>{mean}%</b>
            <span>{s('accuracy')}</span>
          </div>
          <h3 className="sub-h">{s('perQuestion')}</h3>
          <ul className="q-bars">
            {DEMO_ACCURACY.map((v, i) => {
              const mine = myAnswers ? myAnswers[g4Quiz[i].id] === g4Quiz[i].correct : null;
              return (
                <li key={i}>
                  <span className="q-label">Q{i + 1} · {tx(QUESTION_TOPIC[i], lang)}</span>
                  <span className="q-track"><i style={{ width: `${v}%` }} className={v < 60 ? 'low' : v < 70 ? 'mid' : 'ok'} /></span>
                  <span className="q-val">{v}%</span>
                  {mine !== null && <span className={`q-mine ${mine ? 'ok' : 'miss'}`} title={s('device')}>{mine ? '✓' : '✕'}</span>}
                </li>
              );
            })}
          </ul>
          <p className="panel-sub">
            <span className="live-dot" /> {myAnswers ? s('device') : s('deviceNone')}
          </p>
          {!myAnswers && (
            <button className="btn btn-outline btn-block" onClick={() => nav.push({ name: 'kids-station', station: 'quiz' })}>
              {t('gradeN', { n: 4 })} · {t('quizLabel')} {Icon.arrow}
            </button>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-title"><i className="sys-dot" style={{ background: '#FFB547' }} />{s('followUp')}</h2>
          <div className="act act-coral"><b>4-B</b>{s('followText')}</div>
          <div className="act act-amber"><b>4-B</b>{s('followText2')}</div>
        </section>

        <section className="panel">
          <h2 className="panel-title"><i className="sys-dot" style={{ background: '#FF6B5B' }} />{s('review')}</h2>
          <ul className="review-list">
            {REVIEW_ITEMS.map((item) => {
              const status = progress.teacher.reviews[item.id];
              return (
                <li key={item.id}>
                  <div>
                    <b>{tx(item.title, lang)}</b>
                    <span className={`review-status ${status ?? 'draft'}`}>{status === 'approved' ? s('approved') : status === 'flagged' ? s('flagged') : s('draft')}</span>
                  </div>
                  {status ? (
                    <button className="btn btn-quiet" onClick={() => update((p) => void delete p.teacher.reviews[item.id])}>{s('undo')}</button>
                  ) : (
                    <div className="row-btns">
                      <button className="btn btn-outline" onClick={() => update((p) => void (p.teacher.reviews[item.id] = 'flagged'))}>{s('flag')}</button>
                      <button className="btn btn-teacher" onClick={() => update((p) => void (p.teacher.reviews[item.id] = 'approved'))}>{s('approve')}</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="panel-sub">{s('reviewNote')}</p>
        </section>
      </div>
    </main>
  );
}
