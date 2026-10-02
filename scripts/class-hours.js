/**
 * 수업 시간대 판별 — 이 시간에는 운영 서버를 재시작하는 일(배포)을 하지 않는다.
 *
 * 2026-09-23(추석 연휴 전 마지막 수업일) 한국 시간 08:45~12:46에 배포가 15번 있었다.
 * 배포는 서버를 재시작해 열려 있던 수업방을 모두 없애고, 파일 버전표(ETag)를 바꿔
 * 접속 중인 브라우저가 그림을 처음부터 다시 내려받게 한다. 수업 중에 하면 안 된다.
 *
 * 기준은 한국 시간(UTC+9) 평일(월~금) 08:30 이상 15:00 미만이다.
 * 이 PC의 시간대가 어떻든 같은 답이 나온다.
 * 공휴일은 따지지 않는다. 쉬는 평일에 막히면 --now 를 주면 된다.
 */

const START = 8 * 60 + 30;   // 08:30
const END = 15 * 60;         // 15:00
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const kst = (date) => new Date(date.getTime() + 9 * 3600e3);

/** 지금이 수업 시간대인가 */
export function inClassHours(date = new Date()) {
  const k = kst(date);
  const weekday = k.getUTCDay() >= 1 && k.getUTCDay() <= 5;
  const minute = k.getUTCHours() * 60 + k.getUTCMinutes();
  return weekday && minute >= START && minute < END;
}

/** 사람이 읽는 시각 — "금요일 10:05 (한국 시간)" */
export function describeKst(date = new Date()) {
  const k = kst(date);
  const hh = String(k.getUTCHours()).padStart(2, '0');
  const mm = String(k.getUTCMinutes()).padStart(2, '0');
  return `${DAYS[k.getUTCDay()]}요일 ${hh}:${mm} (한국 시간)`;
}
