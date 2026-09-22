/**
 * 수업방 여러 개를 한 서버가 들고 있게 한다.
 *
 * 교실 PC에서 각자 띄울 때는 방이 하나뿐이라 의미가 없지만,
 * 주소 하나를 여러 선생님이 같이 쓰는 배포판(Render 등)에서는 꼭 필요하다.
 * 방이 하나뿐이면 두 반이 같은 코드를 쓰게 되고, 한 선생님이 연 퀴즈가
 * 옆 반 학생 화면에도 떠 버린다.
 *
 * 이 앱에는 로그인이 없다. 대신 선생님 화면이 방을 열 때 받아 가는
 * 긴 열쇠(teacherKey)가 곧 그 방의 주인 증표다. 열쇠는 그 브라우저에만
 * 저장되고, 학생에게 알려주는 것은 여섯 자리 코드뿐이다.
 */

import { randomUUID } from 'node:crypto';
import { Classroom } from './classroom.js';

/** 아무도 안 들어오는 방을 언제까지 들고 있을지 — 한 교시를 넉넉히 넘긴다 */
const IDLE_MS = 6 * 60 * 60 * 1000;

/** 한 서버가 동시에 들고 있을 방의 최대 수 — 메모리가 끝없이 늘지 않게 */
const MAX_ROOMS = 200;

const byKey = new Map();       // teacherKey → room
const byCode = new Map();      // 여섯 자리 코드 → room
const byStudent = new Map();   // studentId → room

/** 방을 하나 연다. 코드가 겹치면 다른 코드가 나올 때까지 다시 만든다. */
export function openRoom({ band = 'mid' } = {}) {
  sweep();
  if (byCode.size >= MAX_ROOMS) {
    dropOldest();
  }

  let room = new Classroom({ band });
  for (let i = 0; i < 20 && byCode.has(room.code); i += 1) {
    room = new Classroom({ band });
  }
  if (byCode.has(room.code)) return null;   // 여기까지 오면 서버가 꽉 찼다

  room.teacherKey = randomUUID();
  room.touchedAt = Date.now();

  byKey.set(room.teacherKey, room);
  byCode.set(room.code, room);
  return room;
}

/** 선생님 열쇠로 방을 찾는다 */
export function roomByKey(key) {
  const room = byKey.get(String(key ?? ''));
  if (room) room.touchedAt = Date.now();
  return room ?? null;
}

/** 학생이 입력한 여섯 자리 코드로 방을 찾는다 */
export function roomByCode(code) {
  const room = byCode.get(String(code ?? '').trim());
  if (room) room.touchedAt = Date.now();
  return room ?? null;
}

/** 학생 아이디로 그 학생이 들어간 방을 찾는다 */
export function roomByStudent(studentId) {
  const room = byStudent.get(String(studentId ?? ''));
  if (room) room.touchedAt = Date.now();
  return room ?? null;
}

/** 학생을 방에 들인다 — 어느 방 사람인지 기억해 둔다 */
export function joinRoom(room, name) {
  const student = room.join(name);
  byStudent.set(student.id, room);
  return student;
}

/** 방을 닫는다. 붙어 있던 학생 화면은 다음 요청에서 재입장 안내를 받는다. */
export function closeRoom(room) {
  if (!room) return;
  room.broadcast('reset');
  byKey.delete(room.teacherKey);
  byCode.delete(room.code);
  for (const [id, r] of byStudent) if (r === room) byStudent.delete(id);
}

/** 오래 조용한 방을 치운다 */
export function sweep() {
  const now = Date.now();
  for (const room of byCode.values()) {
    if (now - (room.touchedAt ?? room.createdAt) > IDLE_MS) closeRoom(room);
  }
}

function dropOldest() {
  let oldest = null;
  for (const room of byCode.values()) {
    if (!oldest || (room.touchedAt ?? 0) < (oldest.touchedAt ?? 0)) oldest = room;
  }
  closeRoom(oldest);
}

/** 지금 몇 방이 열려 있는지 — 로그와 상태 확인용 */
export const roomCount = () => byCode.size;
