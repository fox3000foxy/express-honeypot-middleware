# Express Honeypot Middleware

Express middleware that acts as a honeypot: it logs suspicious traffic and serves decoy responses for common probing routes.

## Features

- Logs traffic to `traffic.txt`
- Logs unknown bot-like requests to `bots.txt`
- Serves mock responses from filesystem-based mockups
- Supports route variants: `default` and `complete`
- Exposes helper endpoints for analysis
- Optional 404 fallback HTML response
- Optional PHP route spoofing (`*.php`)

## Installation

```bash
npm install express-middleware-honeypot
```

## Basic Usage

```js
const express = require("express");
const honeypot = require("express-middleware-honeypot");

const app = express();

honeypot(app, {
    knownPaths: ["/", "/login", "/support"],
    knownPatterns: [/^\/blogs\/[^/]+$/],
    knownApiPaths: ["/api/cart", "/api/cart/list"],
    knownApiPatterns: [/^\/api\/cart\/[^/]+$/],
    logTraffic: true,
    is404Handler: true,
    isCompleteResponses: false,
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
```

## Mockups Structure

Mock responses are loaded from disk instead of hardcoded JSON.

```text
mockups/
    default/
        admin/
            index.mock
        wp-admin/
            setup-config.php/
                index.mock
    complete/
        ...
```

Route to file mapping:

- `/admin` -> `mockups/<variant>/admin/index.mock`
- `/wp-admin/setup-config.php` -> `mockups/<variant>/wp-admin/setup-config.php/index.mock`
- `/` -> `mockups/<variant>/index.mock`

Notes:

- If file content is valid JSON, the middleware returns `res.json(...)`.
- Otherwise, it returns raw text/HTML with `res.send(...)`.

## Runtime Options

- `knownPaths: string[]`
- `knownPatterns: RegExp[]`
- `knownApiPaths: string[]`
- `knownApiPatterns: RegExp[]`
- `logTraffic?: boolean`
- `is404Handler?: boolean`
- `isCompleteResponses?: boolean`

## Analysis Endpoints

- `GET /newBotsRoute`: returns unhandled unknown routes found in logs
- `GET /notCoveredAdditionalEndpoints`: returns additional endpoints not present in current mockups

## Development

This project uses Bun for build and tests.

```bash
bun run build
bun test
```

TypeScript sources are in `src/`, build output is in `dist/`.

## Security Note

This package is a honeypot/deception tool. Do not expose sensitive real data through your app while running it.

## License

MIT
