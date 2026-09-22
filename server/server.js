/**
 * 추석 계기교육 앱 — 교실 로컬 서버
 *   npm start   →  http://localhost:8088
 *
 * 교사 PC에서 켜두고, 학생은 같은 와이파이에서 QR/주소로 들어온다.
 * 수업 중에는 외부 API를 부르지 않는다 (삽화는 전부 사전 생성됨).
 */
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { Classroom } from './classroom.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 8088);

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(ROOT, 'public'), { maxAge: '1h' }));

/** 한 교실만 쓴다. 서버 시작과 함께 열린다. */
let room = new Classroom();
console.log(`\n  📚 수업방 생성 — 입장 코드 ${room.code}\n`);

/* ─────────────── 교사 API ─────────────── */

app.get('/api/teacher/state', (req, res) => {
  res.json(room.snapshot());
});

app.post('/api/teacher/state', (req, res) => {
  room.setState(req.body ?? {});
  res.json(room.snapshot());
});

app.post('/api/teacher/clear', (req, res) => {
  const { kind } = req.body ?? {};
  if (!['wishes', 'opinions', 'quiz', 'reflections'].includes(kind)) {
    return res.status(400).json({ error: '지울 수 없는 항목입니다.' });
  }
  room.clearActivity(kind);
  res.json({ ok: true });
});

/* ─────────── 라이브 퀴즈 (온 반이 동시에) ─────────── */

app.post('/api/teacher/live', (req, res) => {
  const { action, index, questionId, limitMs, choiceCount } = req.body ?? {};

  switch (action) {
    case 'open':
      if (!questionId) return res.status(400).json({ error: 'questionId가 필요합니다.' });
      room.openQuestion({ index, questionId, limitMs, choiceCount });
      break;
    case 'reveal':
      room.revealQuestion();
      break;
    case 'close':
      room.closeLive();
      break;
    case 'reset':
      room.resetLive();
      break;
    default:
      return res.status(400).json({ error: '알 수 없는 동작입니다.' });
  }
  res.json(room.snapshot());
});

/** 수업을 처음부터 다시 — 새 코드가 발급되므로 학생은 재입장해야 한다 */
app.post('/api/teacher/reset', (req, res) => {
  const band = room.band;
  room.broadcast('reset');
  room = new Classroom({ band });
  console.log(`  ♻️  수업방 초기화 — 새 코드 ${room.code}`);
  res.json({ ok: true, code: room.code });
});

/* ─────────────── 학생 API ─────────────── */

app.post('/api/student/join', (req, res) => {
  const { code, name } = req.body ?? {};
  if (String(code) !== room.code) {
    return res.status(404).json({ error: '입장 코드가 맞지 않아요. 칠판을 다시 확인해 주세요.' });
  }
  const student = room.join(name);
  res.json({ student, view: room.studentView(student.id) });
});

app.get('/api/student/state', (req, res) => {
  const { studentId } = req.query;
  if (!room.touch(studentId)) {
    return res.status(410).json({ error: '수업방이 다시 열렸어요. 코드를 다시 입력해 주세요.' });
  }
  res.json(room.studentView(studentId));
});

app.post('/api/student/wish', (req, res) => {
  const { studentId, text, forWhom } = req.body ?? {};
  if (!room.touch(studentId)) return res.status(410).json({ error: '다시 입장해 주세요.' });
  const wish = room.addWish({ studentId, text, forWhom });
  if (!wish) return res.status(400).json({ error: '소원을 적어 주세요.' });
  res.json(wish);
});

app.post('/api/student/opinion', (req, res) => {
  const { studentId, text } = req.body ?? {};
  if (!room.touch(studentId)) return res.status(410).json({ error: '다시 입장해 주세요.' });
  const opinion = room.addOpinion({ studentId, text });
  if (!opinion) return res.status(400).json({ error: '생각을 적어 주세요.' });
  res.json(opinion);
});

app.post('/api/student/quiz', (req, res) => {
  const { studentId, questionId, choice, correct } = req.body ?? {};
  if (!room.touch(studentId)) return res.status(410).json({ error: '다시 입장해 주세요.' });

  /* 라이브 중에는 지금 열린 문제만, 공개 전에만, 한 번만 받는다 */
  if (room.live.on) {
    if (questionId !== room.live.questionId) {
      return res.status(409).json({ error: '지금 풀 수 있는 문제가 아니에요.' });
    }
    if (room.live.revealed || room.remainMs() <= 0) {
      return res.status(409).json({ error: '시간이 끝났어요.' });
    }
    if (room.quizAnswers.get(questionId)?.has(studentId)) {
      return res.status(409).json({ error: '이미 답을 보냈어요.' });
    }
  }

  room.answerQuiz({ studentId, questionId, choice, correct });
  res.json({ ok: true });
});

app.post('/api/student/reflection', (req, res) => {
  const { studentId, learned, thought } = req.body ?? {};
  if (!room.touch(studentId)) return res.status(410).json({ error: '다시 입장해 주세요.' });
  room.saveReflection({ studentId, learned, thought });
  res.json({ ok: true });
});

app.post('/api/student/score', (req, res) => {
  const { studentId, activity, score, detail } = req.body ?? {};
  if (!room.touch(studentId)) return res.status(410).json({ error: '다시 입장해 주세요.' });
  room.saveActivityScore({ studentId, activity, score, detail });
  res.json({ ok: true });
});

/* ─────────────── 실시간 알림 (SSE) ─────────────── */

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  res.write('retry: 3000\n\n');

  const unsubscribe = room.subscribe(res);

  // 프록시가 조용한 연결을 끊지 않도록 주기적으로 신호를 보낸다
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* 이미 끊김 */ }
  }, 20_000);

  req.on('close', () => {
    clearInterval(ping);
    unsubscribe();
  });
});

/* ─────────────── 접속 정보 ─────────────── */

/** 학생에게 안내할 주소 — 교실 와이파이의 실제 IP */
function lanAddress() {
  for (const infos of Object.values(os.networkInterfaces())) {
    for (const info of infos ?? []) {
      if (info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  return 'localhost';
}

app.get('/api/connect', async (req, res) => {
  const host = lanAddress();
  const url = `http://${host}:${PORT}/student.html?code=${room.code}`;
  const qr = await QRCode.toDataURL(url, {
    width: 420,
    margin: 1,
    color: { dark: '#1b1f2e', light: '#ffffff' },
  });
  res.json({ url, host, port: PORT, code: room.code, qr });
});

/* ─────────────── 시작 ─────────────── */

app.listen(PORT, '0.0.0.0', () => {
  const host = lanAddress();
  console.log('  ─────────────────────────────────────────────');
  console.log(`   교사용   http://localhost:${PORT}/teacher.html`);
  console.log(`   학생용   http://${host}:${PORT}/student.html`);
  console.log(`   입장코드 ${room.code}`);
  console.log('  ─────────────────────────────────────────────');
  console.log('   ※ 수업이 끝날 때까지 이 창을 닫지 마세요.\n');
});
