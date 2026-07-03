// Deterministic mock registry keyed by "METHOD path".
// Fixtures are lazy-loaded; latency simulated per call.

type Handler = (ctx: {
  path: string;
  method: string;
  query: URLSearchParams;
  body: unknown;
}) => unknown | Promise<unknown>;

const handlers = new Map<string, Handler>();

export function registerMock(key: string, handler: Handler) {
  handlers.set(key, handler);
}

export function matchMock(method: string, pathWithQuery: string): Handler | null {
  const [path] = pathWithQuery.split("?");
  const exact = handlers.get(`${method} ${path}`);
  if (exact) return exact;

  // Simple :param matching
  for (const [key, handler] of handlers) {
    const [hMethod, hPath] = key.split(" ");
    if (hMethod !== method) continue;
    if (!hPath.includes(":")) continue;
    const pattern = new RegExp(
      "^" + hPath.replace(/:[^/]+/g, "[^/]+") + "$",
    );
    if (pattern.test(path)) return handler;
  }
  return null;
}

export function simulateLatency(): Promise<void> {
  const ms = 60 + Math.floor(Math.random() * 120);
  return new Promise((r) => setTimeout(r, ms));
}
