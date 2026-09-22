/**
 * 수업방 상태 — 교사 화면과 학생 기기를 이어주는 한 덩어리.
 * 한 교실에서 한 시간 쓰는 용도라 메모리에만 둔다.
 * 서버를 껐다 켜면 초기화되므로, 수업 중에는 끄지 않는다.
 */

import { randomUUID } from 'node:crypto';

/** 6자리 숫자 코드 — 칠판에 적어주기 좋은 길이 */
function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class Classroom {
  constructor({ band = 'mid' } = {}) {
    this.code = makeCode();
    this.createdAt = Date.now();

    /* 교사가 통제하는 화면 상태 */
    this.band = band;          // low | mid | high
    this.sectionId = 'opening';
    this.activityOpen = false; // 학생 기기에서 활동을 열지 여부
    this.studentsFollow = true; // true면 학생 화면이 교사를 따라감

    /* 참여자 */
    this.students = new Map();  // id → { id, name, joinedAt, lastSeen }

    /* 활동 결과 */
    this.wishes = [];           // { id, studentId, name, text, forWhom, at }
    this.opinions = [];         // { id, studentId, name, text, at }
    this.quizAnswers = new Map(); // questionId → Map(studentId → { choice, correct, at })
    this.reflections = new Map(); // studentId → { learned, thought, at }
    this.activityScores = new Map(); // studentId → { songpyeon, charye, ganggangsullae }

    /* 라이브 퀴즈 — 온 반이 같은 문제를 동시에 푼다 (퀴즈앤·카훗 방식)
       phase: off → lobby(모이는 중) → question(푸는 중) → final(시상식) */
    this.live = {
      on: false,
      phase: 'off',
      index: -1,        // 몇 번째 문제
      total: 0,         // 모두 몇 문제인지 (학생 화면에 "3 / 10"을 띄우려고)
      questionId: null,
      openedAt: 0,      // 문제가 열린 시각
      limitMs: 20_000,  // 제한시간
      revealed: false,  // 정답 공개 여부
      choiceCount: 4,   // 보기 수 (학생 화면 버튼 수)
    };
    this.points = new Map(); // studentId → 누적 점수

    /* 구독자 (SSE) */
    this.listeners = new Set();
  }

  /* ── 참여 ── */

  join(name) {
    const clean = String(name ?? '').trim().slice(0, 12) || '친구';
    const id = randomUUID();
    const student = { id, name: clean, joinedAt: Date.now(), lastSeen: Date.now() };
    this.students.set(id, student);
    this.broadcast('roster');
    return student;
  }

  touch(studentId) {
    const s = this.students.get(studentId);
    if (s) s.lastSeen = Date.now();
    return !!s;
  }

  leave(studentId) {
    if (this.students.delete(studentId)) this.broadcast('roster');
  }

  /* ── 교사 통제 ── */

  setState({ band, sectionId, activityOpen, studentsFollow }) {
    if (band) this.band = band;
    if (sectionId) this.sectionId = sectionId;
    if (activityOpen !== undefined) this.activityOpen = !!activityOpen;
    if (studentsFollow !== undefined) this.studentsFollow = !!studentsFollow;
    this.broadcast('state');
  }

  /* ── 학생 활동 ── */

  addWish({ studentId, text, forWhom = 'me' }) {
    const name = this.students.get(studentId)?.name ?? '친구';
    const clean = String(text ?? '').trim().slice(0, 60);
    if (!clean) return null;

    const wish = { id: randomUUID(), studentId, name, text: clean, forWhom, at: Date.now() };
    this.wishes.push(wish);
    this.broadcast('wishes');
    return wish;
  }

  addOpinion({ studentId, text }) {
    const name = this.students.get(studentId)?.name ?? '친구';
    const clean = String(text ?? '').trim().slice(0, 200);
    if (!clean) return null;

    const opinion = { id: randomUUID(), studentId, name, text: clean, at: Date.now() };
    this.opinions.push(opinion);
    this.broadcast('opinions');
    return opinion;
  }

  answerQuiz({ studentId, questionId, choice, correct }) {
    if (!this.quizAnswers.has(questionId)) this.quizAnswers.set(questionId, new Map());
    this.quizAnswers.get(questionId).set(studentId, { choice, correct: !!correct, at: Date.now() });
    this.broadcast('quiz');
  }

  /* ── 라이브 퀴즈 ── */

  /**
   * 대기실을 연다 — 아이들이 다 모였는지 눈으로 확인하는 자리.
   *
   * 시작 전이면 점수를 비운다. 연습으로 누른 것이 섞이면 안 되기 때문이다.
   * 다만 퀴즈가 이미 돌고 있는데 선생님이 뒤로 갔다 오는 경우에는 비우지 않는다.
   * 그때 비우면 아이들이 쌓은 점수가 통째로 날아간다.
   */
  openLobby({ total = 10 } = {}) {
    if (this.live.phase === 'off') {
      this.points.clear();
      this.quizAnswers.clear();
    }
    this.live = {
      ...this.live,
      on: true,
      phase: 'lobby',
      index: -1,
      total,
      questionId: null,
      revealed: false,
    };
    this.broadcast('live');
  }

  /** 교사가 문제를 연다 */
  openQuestion({ index, questionId, limitMs = 20_000, choiceCount = 4, total }) {
    this.live = {
      ...this.live,
      on: true,
      phase: 'question',
      index,
      total: total ?? this.live.total,
      questionId,
      openedAt: Date.now(),
      limitMs,
      revealed: false,
      choiceCount,
    };
    this.broadcast('live');
  }

  /** 마지막 문제까지 끝나고 상을 준다 */
  showFinal() {
    this.live = { ...this.live, on: true, phase: 'final', questionId: null, revealed: true };
    this.broadcast('live');
  }

  /** 정답 공개 — 이 시점에 점수를 계산한다 */
  revealQuestion() {
    if (!this.live.on || this.live.revealed) return;
    this.live.revealed = true;

    const answers = this.quizAnswers.get(this.live.questionId);
    if (answers) {
      for (const [studentId, a] of answers) {
        if (!a.correct) continue;
        /* 맞히면 기본 600점, 빨리 누를수록 최대 400점을 더 준다.
           느리게 맞혀도 손해가 크지 않게 기본 점수를 높게 잡았다. */
        const took = Math.max(0, a.at - this.live.openedAt);
        const speed = Math.max(0, 1 - took / this.live.limitMs);
        const gained = 600 + Math.round(400 * speed);
        this.points.set(studentId, (this.points.get(studentId) ?? 0) + gained);
      }
    }
    this.broadcast('live');
  }

  closeLive() {
    this.live = { ...this.live, on: false, phase: 'off', revealed: false, index: -1, questionId: null };
    this.broadcast('live');
  }

  resetLive() {
    this.points.clear();
    this.quizAnswers.clear();
    this.closeLive();
  }

  /** 지금 문제의 응답 분포 */
  liveTally() {
    const answers = this.quizAnswers.get(this.live.questionId);
    const counts = {};
    let correct = 0;
    if (answers) {
      for (const a of answers.values()) {
        counts[a.choice] = (counts[a.choice] ?? 0) + 1;
        if (a.correct) correct += 1;
      }
    }
    return { answered: answers?.size ?? 0, correct, counts };
  }

  /** 점수 순위 */
  leaderboard(top = 8) {
    return [...this.points.entries()]
      .map(([studentId, score]) => ({
        studentId,
        name: this.students.get(studentId)?.name ?? '친구',
        score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, top);
  }

  saveReflection({ studentId, learned, thought }) {
    this.reflections.set(studentId, {
      learned: String(learned ?? '').trim().slice(0, 300),
      thought: String(thought ?? '').trim().slice(0, 300),
      at: Date.now(),
    });
    this.broadcast('reflections');
  }

  saveActivityScore({ studentId, activity, score, detail }) {
    const cur = this.activityScores.get(studentId) ?? {};
    cur[activity] = { score, detail, at: Date.now() };
    this.activityScores.set(studentId, cur);
    this.broadcast('scores');
  }

  /* 교사가 다시 하고 싶을 때 */
  clearActivity(kind) {
    if (kind === 'wishes') this.wishes = [];
    if (kind === 'opinions') this.opinions = [];
    if (kind === 'quiz') this.quizAnswers.clear();
    if (kind === 'reflections') this.reflections.clear();
    this.broadcast(kind);
  }

  /* ── 집계 ── */

  /** 교사 화면이 보는 전체 스냅샷 */
  snapshot() {
    const now = Date.now();
    return {
      code: this.code,
      band: this.band,
      sectionId: this.sectionId,
      activityOpen: this.activityOpen,
      studentsFollow: this.studentsFollow,
      students: [...this.students.values()]
        .map((s) => ({ ...s, online: now - s.lastSeen < 45_000 }))
        .sort((a, b) => a.joinedAt - b.joinedAt),
      wishes: this.wishes,
      opinions: this.opinions,
      quiz: this.quizSummary(),
      reflections: [...this.reflections.entries()].map(([studentId, r]) => ({
        studentId, name: this.students.get(studentId)?.name ?? '친구', ...r,
      })),
      scores: [...this.activityScores.entries()].map(([studentId, s]) => ({
        studentId, name: this.students.get(studentId)?.name ?? '친구', ...s,
      })),
      live: { ...this.live, ...this.liveTally(), remainMs: this.remainMs() },
      leaderboard: this.leaderboard(),
    };
  }

  /** 지금 문제에 남은 시간 */
  remainMs() {
    if (!this.live.on || this.live.revealed) return 0;
    return Math.max(0, this.live.limitMs - (Date.now() - this.live.openedAt));
  }

  /** 학생 화면이 보는 축약 상태 — 남의 답은 주지 않는다 */
  studentView(studentId) {
    return {
      code: this.code,
      band: this.band,
      sectionId: this.sectionId,
      activityOpen: this.activityOpen,
      studentsFollow: this.studentsFollow,
      you: this.students.get(studentId) ?? null,
      classSize: this.students.size,
      wishCount: this.wishes.length,
      /* 소원 벽은 모두가 같이 보는 것이라 이름 없이 문구만 */
      wishTexts: this.wishes.map((w) => ({ id: w.id, text: w.text, forWhom: w.forWhom })),

      /* 라이브 퀴즈 — 공개 전에는 정답도, 남이 뭘 골랐는지도 주지 않는다 */
      live: {
        on: this.live.on,
        phase: this.live.phase,
        index: this.live.index,
        total: this.live.total,
        questionId: this.live.questionId,
        revealed: this.live.revealed,
        choiceCount: this.live.choiceCount,
        remainMs: this.remainMs(),
        limitMs: this.live.limitMs,
        answered: this.quizAnswers.get(this.live.questionId)?.has(studentId) ?? false,
        myChoice: this.quizAnswers.get(this.live.questionId)?.get(studentId)?.choice ?? null,
        myCorrect: this.live.revealed
          ? (this.quizAnswers.get(this.live.questionId)?.get(studentId)?.correct ?? false)
          : null,
        myScore: this.points.get(studentId) ?? 0,
        rank: this.live.revealed ? this.rankOf(studentId) : null,
        /* 시상식에서만 — 단상에 오른 셋을 모두에게 보여준다 */
        podium: this.live.phase === 'final' ? this.leaderboard(3) : null,
      },
    };
  }

  /** 내 등수 (공개된 뒤에만 준다) */
  rankOf(studentId) {
    const sorted = [...this.points.entries()].sort((a, b) => b[1] - a[1]);
    const i = sorted.findIndex(([id]) => id === studentId);
    return i < 0 ? null : { place: i + 1, of: this.students.size };
  }

  quizSummary() {
    const out = {};
    for (const [questionId, byStudent] of this.quizAnswers) {
      const answers = [...byStudent.values()];
      const counts = {};
      for (const a of answers) counts[a.choice] = (counts[a.choice] ?? 0) + 1;
      out[questionId] = {
        total: answers.length,
        correct: answers.filter((a) => a.correct).length,
        counts,
      };
    }
    return out;
  }

  /* ── 실시간 알림 (SSE) ── */

  subscribe(res) {
    this.listeners.add(res);
    return () => this.listeners.delete(res);
  }

  broadcast(kind) {
    const payload = `event: update\ndata: ${JSON.stringify({ kind, at: Date.now() })}\n\n`;
    for (const res of this.listeners) {
      try { res.write(payload); } catch { this.listeners.delete(res); }
    }
  }
}
