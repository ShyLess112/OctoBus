import test from 'node:test';
import assert from 'node:assert/strict';

const buildCtx = (req = {}, overrides = {}) => ({
  config: overrides.config ?? { baseUrl: 'http://localhost:18081' },
  secret: overrides.secret ?? { email: 'test@example.com', key: 'test-key' },
  bindings: { ...overrides.bindings },
  limits: { timeoutMs: 10_000, ...overrides.limits },
  meta: { instance_id: 'inst', request_id: 'req', ...overrides.meta },
  request: req,
});

const setFetch = (impl) => {
  global.fetch = impl;
};

const loadHandler = async (handlerName, req, overrides = {}) => {
  const { handlers } = await import('../src/fofa.js');
  const handler = handlers[handlerName];
  const ctx = buildCtx(req, overrides);
  // Return a callable function that invokes the handler
  return () => handler(ctx);
};

const mockFetch = (impl) => {
  setFetch(async (...args) => impl(...args));
};

test('internal helpers normalize bindings and errors', async () => {
  const { _test } = await import('../src/fofa.js');

  assert.deepEqual(_test.mergedBindings({
    config: { baseUrl: 'http://config' },
    secret: { email: 'secret@example.com', key: 'secret-key' },
    bindings: { baseUrl: 'http://binding' },
  }), {
    baseUrl: 'http://binding',
    email: 'secret@example.com',
    key: 'secret-key',
  });

  assert.deepEqual(_test.parseHeaders(undefined), {});
  assert.deepEqual(_test.parseHeaders(''), {});
  assert.deepEqual(_test.parseHeaders('{"X-Test":"yes"}'), { 'X-Test': 'yes' });
  assert.deepEqual(_test.parseHeaders('{'), {});
  assert.deepEqual(_test.parseHeaders('[]'), {});
  assert.deepEqual(_test.parseHeaders(['bad']), {});

  assert.equal(_test.unwrapString({ value: 'test' }), 'test');
  assert.equal(_test.unwrapString('test'), 'test');
  assert.equal(_test.unwrapString(null), '');
  assert.equal(_test.unwrapString(undefined), '');

  assert.equal(_test.unwrapInt({ value: 42 }), 42);
  assert.equal(_test.unwrapInt(42), 42);
  assert.equal(_test.unwrapInt(null), null);
  assert.equal(_test.unwrapInt(undefined), null);
  assert.equal(_test.unwrapInt('not-a-number'), null);

  assert.equal(_test.unwrapBoolean({ value: true }), true);
  assert.equal(_test.unwrapBoolean(true), true);
  assert.equal(_test.unwrapBoolean(false), false);
  assert.equal(_test.unwrapBoolean(null), false);
  assert.equal(_test.unwrapBoolean(undefined), false);

  assert.equal(_test.normalizeBaseUrl('https://example.com'), 'https://example.com');
  assert.equal(_test.normalizeBaseUrl('https://example.com/'), 'https://example.com');
  assert.equal(_test.normalizeBaseUrl('http://example.com/api/v1'), 'http://example.com/api/v1');
  assert.equal(_test.normalizeBaseUrl('ftp://example.com'), null);
  assert.equal(_test.normalizeBaseUrl(''), null);
  assert.equal(_test.normalizeBaseUrl(null), null);

  const unknown = _test.errorWithCode('SOMETHING_NEW', 'message');
  assert.equal(unknown.legacyCode, 'SOMETHING_NEW');
  assert.match(unknown.message, /SOMETHING_NEW: message/);
});

test('Search validates request fields before downstream call', async () => {
  const noQuery = await loadHandler('FOFA.FOFA/Search', {});
  await assert.rejects(() => noQuery(), /INVALID_ARGUMENT: query is required/);

  const emptyQuery = await loadHandler('FOFA.FOFA/Search', { query: '' });
  await assert.rejects(() => emptyQuery(), /INVALID_ARGUMENT: query is required/);

  const sizeTooLarge = await loadHandler('FOFA.FOFA/Search', { query: 'test', size: 10001 });
  await assert.rejects(() => sizeTooLarge(), /INVALID_ARGUMENT: size must be between 1 and 10000/);

  const sizeTooSmall = await loadHandler('FOFA.FOFA/Search', { query: 'test', size: 0 });
  await assert.rejects(() => sizeTooSmall(), /INVALID_ARGUMENT: size must be between 1 and 10000/);

  const noBaseUrl = await loadHandler('FOFA.FOFA/Search', { query: 'test' }, { config: {} });
  await assert.rejects(() => noBaseUrl(), /INVALID_ARGUMENT: baseUrl is required in config/);

  const noEmail = await loadHandler('FOFA.FOFA/Search', { query: 'test' }, { secret: { key: 'test-key' } });
  await assert.rejects(() => noEmail(), /UNAUTHENTICATED: email and key are required in secret/);

  const noKey = await loadHandler('FOFA.FOFA/Search', { query: 'test' }, { secret: { email: 'test@example.com' } });
  await assert.rejects(() => noKey(), /UNAUTHENTICATED: email and key are required in secret/);
});

test('Search forwards query, headers, and maps results', async () => {
  let captured;
  setFetch(async (url, init) => {
    captured = { url, init };
    return {
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        error: false,
        errmsg: '',
        size: 2,
        next: 'next-token',
        results: [
          { host: 'example.com', ip: '1.1.1.1', port: 443, protocol: 'https' },
          { host: 'test.com', ip: '2.2.2.2', port: 80, protocol: 'http' }
        ]
      }),
    };
  });

  const handler = await loadHandler('FOFA.FOFA/Search', {
    query: 'app="Nginx"',
    page: { value: 1 },
    size: { value: 100 },
    fields: 'host,ip,port,protocol',
    full: { value: false }
  }, {
    config: { baseUrl: 'http://localhost:18081', headers: { 'X-Extra': 'demo' } },
    secret: { email: 'test@example.com', key: 'test-key' }
  });

  const res = await handler();

  assert.match(captured.url, /http:\/\/localhost:18081\/search\//);
  assert.match(captured.url, /email=test%40example\.com/);
  assert.match(captured.url, /key=test-key/);
  assert.match(captured.url, /q=app%3D%22Nginx%22/);
  assert.match(captured.url, /page=1/);
  assert.match(captured.url, /size=100/);
  assert.match(captured.url, /fields=host%2Cip%2Cport%2Cprotocol/);
  // Note: full=false is intentionally omitted from URL (FOFA API issue)

  assert.equal(captured.init.method, 'GET');
  assert.equal(captured.init.headers['User-Agent'], 'OctoBus-FOFA-Client/1.0');
  assert.equal(captured.init.headers['X-Extra'], 'demo');

  assert.equal(res.error, false);
  assert.equal(res.errmsg, '');
  assert.equal(res.size, 2);
  assert.equal(res.next, 'next-token');
  assert.equal(res.results.length, 2);
  assert.equal(res.results[0].host, 'example.com');
  assert.equal(res.results[0].ip, '1.1.1.1');
  assert.equal(res.results[0].port, '443');
  assert.equal(res.results[0].protocol, 'https');
});

test('Search handles response errors', async () => {
  setFetch(async () => ({
    ok: false,
    status: 401,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({ error: true, errmsg: 'Invalid API key' }),
  }));
  const authError = await loadHandler('FOFA.FOFA/Search', { query: 'test' });
  await assert.rejects(() => authError(), /UNAUTHENTICATED: Invalid API key or email/);

  setFetch(async () => ({
    ok: false,
    status: 429,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({ error: true, errmsg: 'Rate limit exceeded' }),
  }));
  const rateLimitError = await loadHandler('FOFA.FOFA/Search', { query: 'test' });
  await assert.rejects(() => rateLimitError(), /UNAVAILABLE: Rate limit exceeded/);

  setFetch(async () => ({
    ok: false,
    status: 500,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({ error: true, errmsg: 'Server error' }),
  }));
  const serverError = await loadHandler('FOFA.FOFA/Search', { query: 'test' });
  await assert.rejects(() => serverError(), /UNAVAILABLE: FOFA server error/);
});

test('GetHost validates request fields', async () => {
  const noHost = await loadHandler('FOFA.FOFA/GetHost', {});
  await assert.rejects(() => noHost(), /INVALID_ARGUMENT: host is required/);

  const emptyHost = await loadHandler('FOFA.FOFA/GetHost', { host: '' });
  await assert.rejects(() => emptyHost(), /INVALID_ARGUMENT: host is required/);
});

test('GetHost forwards request and maps response', async () => {
  let captured;
  setFetch(async (url, init) => {
    captured = { url, init };
    return {
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        error: false,
        errmsg: '',
        host: '1.1.1.1',
        ip: '1.1.1.1',
        ports: [
          { port: 80, protocol: 'http' },
          { port: 443, protocol: 'https' }
        ]
      }),
    };
  });

  const handler = await loadHandler('FOFA.FOFA/GetHost', {
    host: '1.1.1.1',
    detail: { value: true }
  });

  const res = await handler();

  assert.match(captured.url, /\/info\/host/);
  assert.match(captured.url, /host=1\.1\.1\.1/);
  assert.match(captured.url, /detail=true/);

  assert.equal(res.error, false);
  assert.equal(res.errmsg, '');
  assert.ok(res.raw);
});

test('GetAccountInfo handles request', async () => {
  let captured;
  setFetch(async (url, init) => {
    captured = { url, init };
    return {
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        error: false,
        errmsg: '',
        username: 'test@example.com',
        fcoin: 1000,
        vip_level: 1
      }),
    };
  });

  const handler = await loadHandler('FOFA.FOFA/GetAccountInfo', {});
  const res = await handler();

  assert.match(captured.url, /\/info\/my/);
  assert.equal(res.error, false);
  assert.equal(res.errmsg, '');
  assert.ok(res.raw);
});

test('GetStats validates request fields', async () => {
  const noQuery = await loadHandler('FOFA.FOFA/GetStats', {});
  await assert.rejects(() => noQuery(), /INVALID_ARGUMENT: query is required/);

  const noField = await loadHandler('FOFA.FOFA/GetStats', { query: 'test' });
  await assert.rejects(() => noField(), /INVALID_ARGUMENT: field is required/);

  const invalidField = await loadHandler('FOFA.FOFA/GetStats', { query: 'test', field: 'invalid' });
  await assert.rejects(() => invalidField(), /INVALID_ARGUMENT: field must be one of/);
});

test('GetStats forwards request and maps response', async () => {
  let captured;
  setFetch(async (url, init) => {
    captured = { url, init };
    return {
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        error: false,
        errmsg: '',
        aggregations: {
          http: 5000,
          https: 3000,
          ssh: 1000
        }
      }),
    };
  });

  const handler = await loadHandler('FOFA.FOFA/GetStats', {
    query: 'app="Nginx"',
    field: 'protocol'
  });

  const res = await handler();

  assert.match(captured.url, /\/search\/stats/);
  assert.match(captured.url, /q=app%3D%22Nginx%22/);
  assert.match(captured.url, /field=protocol/);

  assert.equal(res.error, false);
  assert.equal(res.errmsg, '');
  assert.ok(res.raw);
});