/**
 * Leonardo.Ai API 클라이언트
 * - v2: 생성 요청 (POST /api/rest/v2/generations, /generationssync)
 * - v1: 사용자 정보·생성 결과 폴링 (GET /api/rest/v1/me, /generations/{id})
 * v2 문서가 모델별 파라미터를 로그인 뒤에만 공개하므로, 모델 목록은 런타임에 조회해서 쓴다.
 */

const BASE = 'https://cloud.leonardo.ai/api/rest';

export class LeonardoError extends Error {
  constructor(message, { status, body, endpoint } = {}) {
    super(message);
    this.name = 'LeonardoError';
    this.status = status;
    this.body = body;
    this.endpoint = endpoint;
  }
}

export class Leonardo {
  constructor(apiKey, { fetchImpl = globalThis.fetch } = {}) {
    if (!apiKey) throw new LeonardoError('LEONARDO_API_KEY가 비어 있습니다. .env를 확인하세요.');
    this.apiKey = apiKey;
    this.fetch = fetchImpl;
  }

  get headers() {
    return {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${this.apiKey}`,
    };
  }

  async request(path, { method = 'GET', body, retries = 3 } = {}) {
    const url = path.startsWith('http') ? path : `${BASE}${path}`;

    let res;
    for (let attempt = 1; ; attempt += 1) {
      try {
        res = await this.fetch(url, {
          method,
          headers: this.headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        break;
      } catch (err) {
        // 학교망에서 TLS 연결이 끊기는 일이 잦다. 지수 백오프로 되살린다.
        const transient = /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket disconnected|fetch failed/i
          .test(err?.cause?.code || err?.cause?.message || err.message);
        if (!transient || attempt > retries) {
          throw new LeonardoError(
            `네트워크 오류 (${attempt}회 시도) — ${err?.cause?.code ?? err.message}`,
            { endpoint: `${method} ${url}` },
          );
        }
        const waitMs = 1000 * 2 ** (attempt - 1);
        this.onRetry?.({ attempt, waitMs, url, reason: err?.cause?.code ?? err.message });
        await sleep(waitMs);
      }
    }

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* 비JSON 응답 */ }

    if (!res.ok) {
      const detail = json?.error || json?.message || text?.slice(0, 400) || '(본문 없음)';
      throw new LeonardoError(`Leonardo API ${res.status} ${res.statusText} — ${detail}`, {
        status: res.status, body: json ?? text, endpoint: `${method} ${url}`,
      });
    }

    // 검증 오류가 HTTP 200 + GraphQL 스타일 배열로 내려오는 경우가 있다.
    const graphqlError = Array.isArray(json)
      ? json.find((e) => e?.extensions?.statusCode >= 400)
      : null;
    if (graphqlError) {
      const ex = graphqlError.extensions;
      const detail = ex?.details?.message || ex?.details?.code || graphqlError.message;
      throw new LeonardoError(`Leonardo API ${ex.statusCode} — ${detail}`, {
        status: ex.statusCode, body: json, endpoint: `${method} ${url}`,
      });
    }

    return json;
  }

  /** 키 유효성 + 크레딧 잔액 */
  me() {
    return this.request('/v1/me');
  }

  /** 사용 가능한 모델 목록 (v2). 실패하면 v1 플랫폼 모델로 폴백. */
  async models() {
    try {
      return { version: 'v2', data: await this.request('/v2/models') };
    } catch (err) {
      if (err.status !== 404 && err.status !== 401) throw err;
      return { version: 'v1', data: await this.request('/v1/platformModels') };
    }
  }

  /** 비동기 생성 요청 → generationId */
  async createGeneration({ model, parameters, public: isPublic = false }) {
    const res = await this.request('/v2/generations', {
      method: 'POST',
      body: { model, public: isPublic, parameters },
    });

    // 응답이 { generate: {...} } 로 한 겹 감싸여 오는 모델이 있다.
    const job = res?.generate ?? res?.sdGenerationJob ?? res;
    const id = job?.generationId;
    if (!id) throw new LeonardoError('generationId를 응답에서 찾지 못했습니다.', { body: res });

    return {
      generationId: id,
      apiCreditCost: job?.apiCreditCost ?? null,
      cost: job?.cost ?? null, // { amount: '0.012', unit: 'DOLLARS' }
      raw: res,
    };
  }

  /** 동기 생성 (sync 지원 모델 한정, ~27초 제한) */
  createSyncGeneration({ model, parameters, ephemeral = false, base64 = false, public: isPublic = false }) {
    return this.request('/v2/generationssync', {
      method: 'POST',
      /* public을 빼면 400 "public must be boolean"이 난다 */
      body: { model, public: isPublic, parameters, ephemeral, base64 },
    });
  }

  getGeneration(generationId) {
    return this.request(`/v1/generations/${generationId}`);
  }

  /**
   * 완료될 때까지 폴링.
   * @returns {{status, images: string[], videos: string[], raw}}
   */
  async waitForGeneration(generationId, { timeoutMs = 300_000, intervalMs = 4_000, onTick } = {}) {
    const startedAt = Date.now();
    let attempt = 0;

    while (Date.now() - startedAt < timeoutMs) {
      attempt += 1;
      const raw = await this.getGeneration(generationId);
      const gen = raw?.generations_by_pk ?? raw?.generation ?? raw;
      const status = (gen?.status || 'PENDING').toUpperCase();

      onTick?.({ attempt, status, elapsedMs: Date.now() - startedAt });

      if (status === 'FAILED') {
        throw new LeonardoError(`생성 실패 (generationId=${generationId})`, { body: gen });
      }
      if (status === 'COMPLETE') {
        return { status, ...collectAssets(gen), raw: gen };
      }
      await sleep(intervalMs);
    }
    throw new LeonardoError(`생성 시간 초과 (${timeoutMs / 1000}초, generationId=${generationId})`);
  }
}

/** 응답 스키마가 모델마다 달라서 이미지/영상 URL을 넓게 훑는다. */
export function collectAssets(gen) {
  const images = new Set();
  const videos = new Set();

  const visit = (node, depth = 0) => {
    if (!node || depth > 6) return;
    if (Array.isArray(node)) return node.forEach((n) => visit(n, depth + 1));
    if (typeof node !== 'object') return;

    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && /^https?:\/\//.test(value)) {
        const isVideo = /motionMP4URL|videoUrl|\.mp4/i.test(key) || /\.mp4(\?|$)/i.test(value);
        const isImage = /url|imageUrl|image_url/i.test(key) || /\.(png|jpe?g|webp)(\?|$)/i.test(value);
        if (isVideo) videos.add(value);
        else if (isImage) images.add(value);
      } else {
        visit(value, depth + 1);
      }
    }
  };

  visit(gen);
  return { images: [...images], videos: [...videos] };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
