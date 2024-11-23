# Express Honeypot Middleware

A middleware that creates a honeypot system to detect and track potential malicious requests while providing fake responses to common attack vectors. It is designed to be used as a development tool to test and analyze the security of your application or handle bot traffic not covered by the main responses. It actually spoof PHP server responses and covers additional endpoints not covered by the main responses.

## Features

- Tracks and logs all incoming traffic
- Provides fake responses to common attack patterns
- Simulates WordPress installations
- Handles various API endpoints with mock data
- Logs bot activities separately
- Supports PHP endpoint simulation
- Includes traffic analysis tools
- Detects unhandled routes and logs them
- Automatically adds unhandled routes to the response system
- Offers detailed logging for bot requests and known paths

## Usage

Basic usage:
```javascript
const express = require('express');
const app = express();
// Initialize the honeypot middleware
require('./honeypotMiddleware')(app);
app.listen(3000, () => {
     console.log('Server running on port 3000');
});
```

You can enable the 404 handler to spoof PHP 404 responses.
With 404 handler enabled (spoof PHP 404):
```javascript
const express = require('express');
const app = express();
// Initialize with 404 handler
require('./honeypotMiddleware')(app, true);
app.listen(3000, () => {
     console.log('Server running on port 3000');
});
```
## isKnownPath

The middleware includes a function to check if a path is known. It is used to determine if the path is a known path or a bot request.
The spoofer can sometimes override the default behavior of your application. This function is used to prevent the spoofer from overriding the default behavior of your application. Add your own known paths and patterns to the `knownPaths`, `knownPatterns`, `knownApiPaths`, or `knownApiPatterns` arrays in the middleware.

If you want to try it out, try to remove and add `/sitemap.xml` to the `knownPaths` array.

## Configuration

The middleware automatically handles:
- Traffic logging to `traffic.txt`
- Bot requests logging to `bots.txt`
- Known path filtering
- Mock responses for common attack vectors
- PHP endpoint simulation
- WordPress installation simulation

## API

### Known Paths
The middleware includes a comprehensive list of known paths and patterns that are considered legitimate. These include:
- Static paths (e.g., '/', '/login', '/register')
- Dynamic paths (e.g., '/blogs/{blogId}')
- API paths (e.g., '/api/cart', '/api/cart/{productId}')

You can add your own known paths by adding them to the `knownPaths`, `knownBotsPaths` or `knownApiPaths` arrays in the middleware.

### Logging
Traffic is logged in the following format:
```
Date - IP - Browser - Method - Path - Status - User
```

Example:
```
2024-11-20T14:19:37.295Z - 91.247.75.125 - Mozilla/5.0 - GET /sss - 200 - guest
```

traffic.txt is created in the root of the project. It acts like a PHP server log file.
bots.txt is created in the root of the project. It acts like a PHP server log file for logged bot requests. 
Bots requests are requests that are not covered by known paths.

### Analysis Tools Endpoints

#### Get Unhandled Routes: /newBotsRoute
#### Get Known Paths: /notCoveredAdditionalEndpoints


## Security Considerations

This middleware is designed to be a honeypot system. Make sure to:
- Not use it on production systems containing sensitive data
- Monitor the logs regularly
- Keep the middleware updated with new attack patterns
- Consider rate limiting and IP blocking for persistent attackers

## License

MIT
