// 기존 파일명을 유지해 그림을 교체했으므로, 오래 저장된 브라우저 이미지와 주소를 구분한다.
export const ART_VERSION = '20260923-korean-art';

export function artUrl(path) {
  return `${path}?v=${ART_VERSION}`;
}
