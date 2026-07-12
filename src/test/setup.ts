import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

type MockResponseConfig = Partial<Response> & {
  json?: unknown | (() => unknown) | (() => Promise<unknown>);
  text?: string | (() => string) | (() => Promise<string>);
};

type MockResponseEntry = {
  pattern: string | RegExp;
  response: MockResponseConfig | (() => MockResponseConfig);
  queue: MockResponseConfig[];
};

// Armazena configurações de mock por URL
const mockResponses: Map<string, MockResponseEntry> = new Map();

/**
 * Configura um mock para uma URL específica.
 * Suporta string (match parcial) ou RegExp.
 */
export function mockFetchUrl(
  pattern: string | RegExp,
  response: MockResponseConfig | (() => MockResponseConfig),
) {
  const key = typeof pattern === "string" ? pattern : pattern.source;
  mockResponses.set(key, {
    pattern,
    response,
    queue: [],
  });
}

/**
 * Configura múltiplos mocks de uma vez.
 */
export function mockFetchUrls(config: Record<string, MockResponseConfig>) {
  for (const [url, response] of Object.entries(config)) {
    mockFetchUrl(url, response);
  }
}

/**
 * Limpa todas as configurações de mock.
 */
export function resetFetchMocks() {
  mockResponses.clear();
  // Manter mock de materialize sempre presente
  mockFetchUrl("/api/transactions/materialize", mockJsonResponse(null));
}

/**
 * Adiciona uma response à fila de chamadas para uma URL.
 * Útil para testar múltiplas chamadas com responses diferentes.
 */
export function enqueueFetchResponse(
  pattern: string,
  response: MockResponseConfig,
) {
  const key = pattern;
  let entry = mockResponses.get(key);
  if (!entry) {
    entry = {
      pattern,
      response: {},
      queue: [],
    };
    mockResponses.set(key, entry);
  }
  entry.queue.push(response);
}

/**
 * Cria uma response JSON mock.
 */
export function mockJsonResponse<T>(
  data: T,
  status = 200,
): MockResponseConfig {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

/**
 * Cria uma response de erro mock.
 */
export function mockErrorResponse(
  status: number,
  message?: string,
): MockResponseConfig {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => message ?? String(status),
  };
}

function resolveResponse(config: MockResponseConfig | (() => MockResponseConfig) | (() => Promise<Response>)): Response | Promise<Response> {
  // If config is a function that might return a Promise<Response> (for pending state testing)
  if (typeof config === "function") {
    const result = config();
    // If the result is already a Promise<Response>, return it directly
    if (result instanceof Promise) {
      return result;
    }
    // Otherwise, treat it as MockResponseConfig
    config = result as MockResponseConfig;
  }

  const resolved = config as MockResponseConfig;

  return {
    ok: resolved.ok ?? true,
    status: resolved.status ?? 200,
    statusText: resolved.statusText ?? "OK",
    headers: resolved.headers ?? new Headers(),
    body: resolved.body ?? null,
    json:
      resolved.json ??
      (async () => {
        if (resolved.body) return {};
        return {};
      }),
    text:
      resolved.text ??
      (async () => {
        if (resolved.body) return String(resolved.body);
        return "";
      }),
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function () {
      return this;
    },
  } as Response;
}

const defaultImpl = (...args: unknown[]) => {
  const url = String(args[0]);
  const options = args[1] as RequestInit | undefined;

  // Buscar match em mockResponses
  for (const entry of mockResponses.values()) {
    const matches =
      entry.pattern instanceof RegExp
        ? entry.pattern.test(url)
        : url.includes(entry.pattern);

    if (matches) {
      // Se há fila de responses, consome a primeira
      if (entry.queue.length > 0) {
        const queued = entry.queue.shift()!;
        return Promise.resolve(resolveResponse(queued));
      }
      // Caso contrário, usa a response configurada
      // Se a response é uma função, passa os argumentos para ela
      if (typeof entry.response === "function") {
        const result = (entry.response as (input: string, init?: RequestInit) => MockResponseConfig | Promise<Response>)(url, options);
        // Se o resultado já é uma Promise, retorna diretamente
        if (result instanceof Promise) {
          return result;
        }
        return Promise.resolve(resolveResponse(result));
      }
      return Promise.resolve(resolveResponse(entry.response));
    }
  }

  // Defaults existentes para componentes que buscam na montagem
  if (url.includes("/api/exchange-rate")) {
    return Promise.resolve({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => "",
    } as Response);
  }
  if (url.includes("/api/version")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      text: async () => "1.0.0-test",
    } as Response);
  }

  return Promise.reject(
    new Error(`fetch mock não configurado para este teste. URL: ${url}`),
  );
};

Object.defineProperty(globalThis, "fetch", {
  value: vi.fn(defaultImpl),
  writable: true,
});

// Re-aplica implementação default após testes que chamam mockReset
afterEach(() => {
  vi.mocked(globalThis.fetch).mockImplementation(defaultImpl);
  // Garantir que o mock de materialize sempre existe
  mockFetchUrl("/api/transactions/materialize", mockJsonResponse(null));
});
