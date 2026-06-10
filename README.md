# Express Honeypot Middleware

Express middleware that acts as a honeypot: it logs suspicious traffic and serves ultra-realistic decoy responses for common probing routes (328 endpoints × 2 variants).

## Features

- **On-the-fly generation** — no mockup files on disk, each request gets a fresh timestamp/request_id
- **328 endpoints** with realistic tailored content (credentials, configs, API responses, login pages, phishing landings, etc.)
- **2 variants**: `default` (succinct but credible) and `complete` (rich, detailed)
- **Generator script** — `bun run scripts/generate-mockups.ts` to write files for debugging
- **Traffic logging** — JSON-lines format, on-demand bot extraction via `/newBotsRoute`
- **PHP spoofing** — proxies `*.php` requests to localhost for real responses
- **Composable API** — `createHoneypot()` returns `{ mocks, phpSpoofer, notFoundHandler, register, ... }`
- **Backward-compat** — `createHoneypot(app, options)` auto-registers

## Installation

```bash
npm install express-middleware-honeypot
```

## Basic Usage

### With `register()` (auto-registers all routes)

```js
const express = require("express");
const { createHoneypot } = require("express-middleware-honeypot");

const app = express();

const instance = createHoneypot({
    knownPaths: ["/", "/login", "/support"],
    knownPatterns: [/^\/blogs\/[^/]+$/],
    knownApiPaths: ["/api/cart", "/api/cart/list"],
    knownApiPatterns: [/^\/api\/cart\/[^/]+$/],
    logTraffic: true,
    is404Handler: true,
    isCompleteResponses: false,
});

instance.register(app);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
```

### With `app.use()` (single catch-all middleware)

```js
const { createHoneypot } = require("express-middleware-honeypot");

const app = express();

// Your real routes first
app.get("/", (req, res) => res.send("Home"));

// Then the honeypot catch-all
const instance = createHoneypot({ /* options */ });
app.use(instance.middleware);
app.use(instance.phpSpoofer);
```

### Individual mocks with `app.all()`

```js
const instance = createHoneypot({ /* options */ });

// Register only specific endpoints
app.all('/admin', instance.mocks['/admin']);
app.all('/.env', instance.mocks['/.env']);
app.all('/wp-admin', instance.mocks['/wp-admin']);
```

`instance.mocks` is a `Record<string, Middleware>` keyed by endpoint path — pick the ones you want.

### Custom headers

Middleware that sets realistic response headers — spoofs `Server`, `X-Powered-By` (dynamically chosen based on file extension), security headers:

```js
app.use(instance.headersMiddleware);
app.use(instance.middleware);
```

- `.php` → `X-Powered-By: PHP/8.1.12`
- `.jsp` → `X-Powered-By: JSP/3.0`
- `.aspx/.ashx/.asmx` → `X-Powered-By: ASP.NET`
- `.do/.action` → `X-Powered-By: Servlet/3.0`
- other paths → no `X-Powered-By` header

### PHP Spoofer

`instance.phpSpoofer` intercepts `*.php` requests and proxies them to your local dev server, returning real PHP-processed output instead of a static mock:

```js
app.use(instance.phpSpoofer);
```

How it works:
1. Catches requests with `.php` in the path (e.g. `/wp-admin/setup-config.php`)
2. Strips the `.php` suffix and proxies to `http://localhost:<port>/<base>`
3. If your local PHP server (Valet, Laravel, etc.) responds, the HTML is returned
4. If the host is not localhost, it returns a hard 404 (prevents SSRF)
5. No local PHP server? Falls through to your 404 handler

This lets you run a real WordPress/PHP app on localhost and have the honeypot serve real rendered pages to bots. For production or when no local PHP server is available, skip the phpSpoofer and the static `.php` mockups are used instead.

### Shorthand (auto-registers)

```js
createHoneypot(app, { knownPaths: [], ... });
```

## Runtime Options

| Option | Type | Default | Description |
|---|---|---|---|
| `knownPaths` | `string[]` | `[]` | Paths handled by the real app (excluded from mockups) |
| `knownPatterns` | `RegExp[]` | `[]` | Regex patterns for real app paths |
| `knownApiPaths` | `string[]` | `[]` | API paths handled by the real app |
| `knownApiPatterns` | `RegExp[]` | `[]` | Regex patterns for real API paths |
| `logTraffic` | `boolean` | `false` | Log all traffic to `traffic.txt` |
| `is404Handler` | `boolean` | `false` | Register a fallback 404 handler |
| `isCompleteResponses` | `boolean` | `false` | Use the "complete" (rich detail) variant |
| `additionalEndpoints` | `string[]` | `["/not_covered_endpoint_test"]` | Extra endpoints to serve beyond the built-in 328 |
| `enrichResponses` | `boolean` | `true` | Wrap JSON responses with timestamp/version fields |

## Mockups

Mock content is **generated on-the-fly** by `src/services/mockupGenerator.ts` — no filesystem I/O at runtime. Each response receives a fresh `timestamp` and `request_id`, making every reply look like it came from a live server.

The generator covers **328 endpoints** across two variants:

- **Default** — succinct but believable (`{ code: 0, message: "ok", data: {...} }`)
- **Complete** — rich responses with timestamps, request IDs, meta, version headers, etc.

To write mockups to disk for debugging:

```bash
bun run scripts/generate-mockups.ts --dry-run   # preview only
bun run scripts/generate-mockups.ts --list-uncategorized  # show catchall endpoints
```

### Content types served

| Type | Example endpoints |
|---|---|
| Credential leaks | `.env`, `secrets.json`, `aws/credentials`, `etc/shadow` |
| SSH keys | `.ssh/id_rsa`, `.ssh/id_ed25519` |
| Database configs | `config/database`, `wp-config.php`, `docker-compose.yml` |
| Admin panels | `/admin`, `/wp-admin`, `/manage/account/login` |
| API responses | `/api/version`, `/api/config`, `.do`, `.ashx` |
| Banking phishing | `/lander/sber*`, `/index_sber.php`, Russian bank landings |
| C2 heartbeats | Random 6+ char paths (`/262LBNFp`, `/Kd67Fq1x`) |
| Stock/crypto | `/stock/mzhishu`, `/kline/1m/1`, `/m/allticker/1` |
| Gambling/gaming | `/proxy/games`, `/Ctrls/GetSysCoin`, `/room/getRoomBangFans` |
| Config files | `config.json`, `config.yml`, `sitemap.xml`, `ads.txt` |
| Landing pages | `/about`, `/contact`, `/products`, `/blog` |

## Analysis Endpoints

| Route | Description |
|---|---|
| `GET /newBotsRoute` | Returns unhandled unknown routes found in traffic logs |
| `GET /notCoveredAdditionalEndpoints` | Returns additional endpoints not in the built-in 328 |

## HoneypotInstance API

```ts
interface HoneypotInstance {
  mocks: Record<string, Middleware>;       // Individual mock handlers
  middleware: Middleware;                  // Single catch-all (use with app.use())
  headersMiddleware: Middleware;           // Sets realistic response headers
  phpSpoofer: Middleware;                  // PHP spoofing middleware
  notFoundHandler: Middleware;             // 404 fallback handler
  register(app: RouteApp): void;           // Register all handlers on an Express app
  getUnhandledRoutes(): Promise<string[]>; // Get unhandled bot routes
  getNotCoveredEndpoints(): string[];      // Get additional uncovered endpoints
}
```

## Development

```bash
bun install
bun test          # 36+ tests
bun run build     # TypeScript → dist/
```

## Security Note

This package is a honeypot/deception tool. Do not expose sensitive real data through your app while running it.

## License

MIT
