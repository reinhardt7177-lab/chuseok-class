/**
 * 추석 계기교육 앱 — 수업 서버
 *   npm start   →  http://localhost:8088
 *
 * 교실 PC에서 켜두고, 학생은 같은 와이파이에서 QR/주소로 들어온다.
 * 수업 중에는 외부 API를 부르지 않는다 (삽화는 전부 사전 생성됨).
 *
 * 방은 선생님 화면이 열릴 때 하나씩 만들어진다.
 * 그래서 주소 하나를 여러 선생님이 같이 써도 반끼리 섞이지 않는다.
 */
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import {
  openRoom, roomByKey, roomByCode, roomByStudent,
  joinRoom, closeRoom, sweep, roomCount,
} from './rooms.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 8088);

const app = express();
app.use(express.json({ limit: '256kb' }));
/**
 * 정적 파일.
 *
 * 이미지도 같은 파일명으로 교체할 수 있으므로 매번 갱신 여부를 확인한다.
 * 안 바뀐 파일은 ETag로 304 응답을 받는다.
 */
app.use(express.static(path.join(ROOT, 'public'), {
  etag: true,
  setHeaders(res) {
    res.setHeader('cache-control', 'no-cache');
  },
}));

/* 한 시간에 한 번 빈 방을 치운다 */
setInterval(sweep, 60 * 60 * 1000).unref();

/**
 * 선생님 열쇠로 방을 찾아 준다. 없으면 410을 돌려주어
 * 화면이 "방을 다시 열라"는 것을 알 수 있게 한다.
 */
function teacherRoom(req, res) {
  const key = req.body?.key ?? req.query?.key;
  const room = roomByKey(key);
  if (!room) {
    res.status(410).json({ error: '수업방이 닫혔어요. 화면을 새로고침해 주세요.' });
    return null;
  }
  return room;
}

/** 학생 아이디로 방을 찾아 준다 */
function studentRoom(req, res) {
  const studentId = req.body?.studentId ?? req.query?.studentId;
  const room = roomByStudent(studentId);
  if (!room || !room.touch(studentId)) {
    res.status(410).json({ error: '수업방이 다시 열렸어요. 코드를 다시 입력해 주세요.' });
    return null;
  }
  return room;
}

/* ─────────────── 교사 API ─────────────── */

/** 방 열기 — 선생님 화면이 처음 뜰 때 한 번 부른다 */
app.post('/api/teacher/open', (req, res) => {
  const room = openRoom({ band: req.body?.band ?? 'mid' });
  if (!room) return res.status(503).json({ error: '지금은 수업방을 더 열 수 없어요. 잠시 뒤에 다시 해주세요.' });
  console.log(`  📚 수업방 열림 — 코드 ${room.code} (지금 ${roomCount()}방)`);
  res.json({ key: room.teacherKey, code: room.code });
});

app.get('/api/teacher/state', (req, res) => {
  const room = teacherRoom(req, res);
  if (room) res.json(room.snapshot());
});

app.post('/api/teacher/state', (req, res) => {
  const room = teacherRoom(req, res);
  if (!room) return;
  room.setState(req.body ?? {});
  res.json(room.snapshot());
});

app.post('/api/teacher/clear', (req, res) => {
  const room = teacherRoom(req, res);
  if (!room) return;
  const { kind } = req.body ?? {};
  if (!['wishes', 'opinions', 'quiz', 'reflections'].includes(kind)) {
    return res.status(400).json({ error: '지울 수 없는 항목입니다.' });
  }
  room.clearActivity(kind);
  res.json({ ok: true });
});

/* ─────────── 라이브 퀴즈 (온 반이 동시에) ─────────── */

app.post('/api/teacher/live', (req, res) => {
  const room = teacherRoom(req, res);
  if (!room) return;
  const { action, index, questionId, limitMs, choiceCount, total } = req.body ?? {};

  switch (action) {
    case 'lobby':                       // 아이들이 모이는 대기실
      room.openLobby({ total });
      break;
    case 'open':
      if (!questionId) return res.status(400).json({ error: 'questionId가 필요합니다.' });
      room.openQuestion({ index, questionId, limitMs, choiceCount, total });
      break;
    case 'final':                       // 시상식
      room.showFinal();
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
  const old = teacherRoom(req, res);
  if (!old) return;
  const band = old.band;
  closeRoom(old);

  const room = openRoom({ band });
  if (!room) return res.status(503).json({ error: '수업방을 다시 열지 못했어요.' });
  console.log(`  ♻️  수업방 새로 열림 — 코드 ${room.code}`);
  res.json({ ok: true, key: room.teacherKey, code: room.code });
});

/* ─────────────── 학생 API ─────────────── */

app.post('/api/student/join', (req, res) => {
  const { code, name } = req.body ?? {};
  const room = roomByCode(code);
  if (!room) {
    return res.status(404).json({ error: '입장 코드가 맞지 않아요. 칠판을 다시 확인해 주세요.' });
  }
  const student = joinRoom(room, name);
  res.json({ student, view: room.studentView(student.id) });
});

app.get('/api/student/state', (req, res) => {
  const room = studentRoom(req, res);
  if (room) res.json(room.studentView(req.query.studentId));
});

app.post('/api/student/wish', (req, res) => {
  const room = studentRoom(req, res);
  if (!room) return;
  const { studentId, text, forWhom } = req.body ?? {};
  const wish = room.addWish({ studentId, text, forWhom });
  if (!wish) return res.status(400).json({ error: '소원을 적어 주세요.' });
  res.json(wish);
});

app.post('/api/student/opinion', (req, res) => {
  const room = studentRoom(req, res);
  if (!room) return;
  const { studentId, text } = req.body ?? {};
  const opinion = room.addOpinion({ studentId, text });
  if (!opinion) return res.status(400).json({ error: '생각을 적어 주세요.' });
  res.json(opinion);
});

app.post('/api/student/quiz', (req, res) => {
  const room = studentRoom(req, res);
  if (!room) return;
  const { studentId, questionId, choice, correct } = req.body ?? {};

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
  const room = studentRoom(req, res);
  if (!room) return;
  const { studentId, learned, thought } = req.body ?? {};
  room.saveReflection({ studentId, learned, thought });
  res.json({ ok: true });
});

app.post('/api/student/score', (req, res) => {
  const room = studentRoom(req, res);
  if (!room) return;
  const { studentId, activity, score, detail } = req.body ?? {};
  room.saveActivityScore({ studentId, activity, score, detail });
  res.json({ ok: true });
});

/* ─────────────── 실시간 알림 (SSE) ─────────────── */

/**
 * 자기 방의 소식만 받는다.
 * 선생님은 key로, 학생은 studentId로 어느 방인지 알린다.
 */
app.get('/api/events', (req, res) => {
  const room = roomByKey(req.query.key) ?? roomByStudent(req.query.studentId);
  if (!room) return res.status(410).end();

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

/**
 * 학생에게 알려줄 주소의 앞부분.
 *
 * 세 경우를 모두 맞춰야 한다.
 *   배포판          — 프록시 뒤라 Host에 진짜 주소가 온다 (https://....onrender.com)
 *   교실, localhost — 선생님 화면 주소가 localhost다. 그대로 주면 학생 기기가 못 들어온다.
 *   교실, 와이파이  — 이미 옳은 주소이므로 그대로 쓴다.
 *
 * 프록시 헤더는 값이 여럿 붙어 올 수 있어 앞의 것만 쓴다.
 */
function publicOrigin(req) {
  const first = (v) => String(v ?? '').split(',')[0].trim();
  const host = first(req.get('x-forwarded-host')) || first(req.get('host'));
  const loopback = !host || /^(localhost|127\.|\[?::1\]?)/i.test(host);
  if (loopback) return `http://${lanAddress()}:${PORT}`;

  const proto = first(req.get('x-forwarded-proto')) || req.protocol;
  return `${proto}://${host}`;
}

/**
 * 학생 접속 주소와 QR.
 *
 * key 없이 부르면 "서버는 살아 있다"는 대답만 한다.
 * 화면이 교실 서버가 있는지 알아볼 때 이렇게 쓴다.
 */
app.get('/api/connect', async (req, res) => {
  const room = roomByKey(req.query.key);
  if (!room) return res.json({ server: true });

  const origin = publicOrigin(req);
  const url = `${origin}/student.html?code=${room.code}`;
  const qr = await QRCode.toDataURL(url, {
    width: 420,
    margin: 1,
    color: { dark: '#1b1f2e', light: '#ffffff' },
  });
  res.json({ url, origin, code: room.code, qr });
});

/* ─────────────── 넘어진 자리 ─────────────── */

/**
 * 수업 도중 예상 못 한 오류 하나로 프로세스가 죽으면
 * 그 반 학생 서른 명이 한꺼번에 튕긴다. 오류는 남기고 계속 돈다.
 */
app.use((err, req, res, _next) => {
  console.error(`  ⚠️  ${req.method} ${req.path} —`, err?.message ?? err);
  if (!res.headersSent) res.status(500).json({ error: '잠시 문제가 있었어요. 다시 해주세요.' });
});

process.on('uncaughtException', (err) => {
  console.error('  ⚠️  처리 못 한 오류 —', err?.stack ?? err);
});
process.on('unhandledRejection', (err) => {
  console.error('  ⚠️  처리 못 한 거절 —', err?.stack ?? err);
});

/* ─────────────── 시작 ─────────────── */

app.listen(PORT, '0.0.0.0', () => {
  const host = lanAddress();
  console.log('  ─────────────────────────────────────────────');
  console.log(`   교사용   http://localhost:${PORT}/teacher.html`);
  console.log(`   학생용   http://${host}:${PORT}/student.html`);
  console.log('  ─────────────────────────────────────────────');
  console.log('   선생님 화면을 열면 그 화면만의 입장 코드가 나옵니다.');
  console.log('   ※ 수업이 끝날 때까지 이 창을 닫지 마세요.\n');
});
