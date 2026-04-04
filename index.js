const fetch = require('node-fetch');

const fs = require("fs");
const pathModule = require('path');


// ========================================
// UTILITY FUNCTIONS
// ========================================

// Log Format: Date - Ip - Browser - Method - Path - Status - User
// Exemple: 2024-11-20T14:19:37.295Z - 91.247.75.125 - Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 - GET /sss - 200 - 1

if(!fs.existsSync(`${__dirname}/traffic.txt`)) fs.writeFileSync(`${__dirname}/traffic.txt`, "");
if(!fs.existsSync(`${__dirname}/bots.txt`)) fs.writeFileSync(`${__dirname}/bots.txt`, "");

const MOCKUPS_DIR = pathModule.join(__dirname, 'mockups');

function endpointToMockupPath(endpoint, variant = 'default') {
    const cleanEndpoint = endpoint.split('?')[0];
    const segments = cleanEndpoint.split('/').filter(Boolean);

    if (segments.length === 0) return pathModule.join(MOCKUPS_DIR, variant, 'index.mock');
    return pathModule.join(MOCKUPS_DIR, variant, ...segments, 'index.mock');
}

function parseResponseFromDisk(fileContent) {
    const trimmed = fileContent.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.parse(trimmed);
        } catch (_e) {
            return fileContent;
        }
    }
    return fileContent;
}

function getVariantEndpoints(variant = 'default') {
    const variantRoot = pathModule.join(MOCKUPS_DIR, variant);
    if (!fs.existsSync(variantRoot)) return [];

    const endpoints = [];

    function walk(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        entries.forEach(entry => {
            const entryPath = pathModule.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                walk(entryPath);
                return;
            }

            if (entry.name !== 'index.mock') return;

            const relativePath = pathModule.relative(variantRoot, entryPath).split(pathModule.sep).join('/');
            const endpoint = relativePath === 'index.mock'
                ? '/'
                : `/${relativePath.replace(/\/index\.mock$/, '')}`;
            endpoints.push(endpoint);
        });
    }

    walk(variantRoot);
    return endpoints;
}

function ensureMockupForEndpoint(endpoint, variant = 'default', responseObject = null) {
    const mockupFilePath = endpointToMockupPath(endpoint, variant);
    const mockupDir = pathModule.dirname(mockupFilePath);
    if (!fs.existsSync(mockupDir)) {
        fs.mkdirSync(mockupDir, { recursive: true });
    }

    if (!fs.existsSync(mockupFilePath) && responseObject) {
        fs.writeFileSync(mockupFilePath, JSON.stringify(responseObject, null, 2), 'utf-8');
    }
}

function getDiskMockupResponse(endpoint, variant = 'default') {
    const mockupFilePath = endpointToMockupPath(endpoint, variant);
    if (!fs.existsSync(mockupFilePath)) return null;
    const fileContent = fs.readFileSync(mockupFilePath, 'utf-8');
    return parseResponseFromDisk(fileContent);
}

function normalizeEndpointPath(endpoint) {
    if (!endpoint) return '/';
    const noQuery = endpoint.split('?')[0];
    const normalized = noQuery.replace(/\/$/, '');
    return normalized || '/';
}

function isKnownPath(path, {knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}) {
    if (!path) return { isKnown: false, type: 'unknown' };
    path = path.replace(/GET|POST|DELETE|PUT|PATCH/g, "")
        .trim();
    // Normalize path by removing query params and trailing slashes
    const normalizedPath = path.split('?')[0];
    const withoutTrailingSlash = normalizedPath.replace(/\/$/, "");

    const isKnown = {
        isKnown: knownPaths.includes(withoutTrailingSlash) ||
                 knownPatterns.some(pattern => pattern.test(withoutTrailingSlash)) ||
                 knownApiPaths.includes(withoutTrailingSlash) ||
                 knownApiPatterns.some(pattern => pattern.test(withoutTrailingSlash)),
        type: normalizedPath.startsWith('/api/') ? 'api' : 'page'
    };
    // console.log(normalizedPath, isKnown, knownPaths.includes(withoutTrailingSlash))
    return isKnown;
}
const defaultEndpoints = getVariantEndpoints('default');
const completeEndpoints = getVariantEndpoints('complete');

const additionalEndpoints = [
    '/not_covered_endpoint_test' // must be un covered by responses variable, but doesnt show in the logs
]

// Console not covered additional endpoints by responses variables
let notCoveredAdditionalEndpoints = additionalEndpoints.filter(endpoint => !defaultEndpoints.includes(endpoint));

// Add additional endpoints to disk mockups
notCoveredAdditionalEndpoints.forEach(endpoint => {
    ensureMockupForEndpoint(endpoint, 'default', {
        status: 'Endpoint active',
        description: `This endpoint is active and serves requests for ${endpoint}.`
    });
});

function getUnhandledRoutes(routes, {knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}) {
    let unhandledRoutes = [];
    const availableEndpoints = getVariantEndpoints('default');
    const botsRequests = getAllBotsRequests({knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}); // its a txt log file
    botsRequests.split('\n').forEach(botRequest => {
        const path = botRequest.split(" - ")[2]
            .replace(/^(GET|POST|DELETE|PUT|PATCH|HEAD) /, "")
            .trim();
        
        const isKnown = isKnownPath(path,{knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}).isKnown;
        console.log(path, isKnown)
        const isAdditionalEndpoint = additionalEndpoints.includes(path);
        const normalizedPath = normalizeEndpointPath(path);
        const isResponseKey = availableEndpoints
            .some(endpoint => normalizeEndpointPath(endpoint) === normalizedPath);

        if (!isKnown && !isAdditionalEndpoint && !isResponseKey) {
            unhandledRoutes.push(path);
        }
    });
    return [...new Set(unhandledRoutes)];
}

// Helper function to get current timestamp
function getCurrentTimestamp() {
    return new Date().toISOString();
}

module.exports = (app, {
        is404Handler,
        logTraffic,
        knownPaths,
        knownApiPaths,
        knownPatterns,
        knownApiPatterns,
        isCompleteResponses=false
    }) => {
    if(logTraffic) logTraffic(app);

    //console.log(knownPaths)

    const variant = isCompleteResponses ? 'complete' : 'default';
    const endpoints = isCompleteResponses ? completeEndpoints : getVariantEndpoints('default');

    endpoints.forEach(async endpoint => {
        const response = getDiskMockupResponse(endpoint, variant);
        const isKnown = isKnownPath(endpoint,{knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}).isKnown
        if(isKnown || response === null) {
            return;
        }

        app.all(endpoint,async  (req, res) => {
            // Handle new response formats
            if (typeof response === 'string') {
                res.send(response);
            } else if (typeof response === 'object' && response !== null) {
                const runtimeResponse = { ...response };
                runtimeResponse.timestamp = getCurrentTimestamp();
                runtimeResponse.version = "1.0";
                runtimeResponse.lastUpdated = "2023-10-01";
                res.json(runtimeResponse);
            } else {
                res.status(500).send('Invalid response format');
            }
        });
    });

    app.get('/newBotsRoute', (req, res) => {
        const unhandledRoutes = getUnhandledRoutes(additionalEndpoints,{knownPaths, knownPatterns, knownApiPaths, knownApiPatterns});
        res.setHeader('Content-Type', 'text/plain');
        res.send(unhandledRoutes.join('\n'));
    });

    app.get('/notCoveredAdditionalEndpoints', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(notCoveredAdditionalEndpoints));
    });

    // Spoof php versions of existing pages
    app.get('*.php', async (req, res) => {
        const host = req.headers.host;
        const response = await fetch(`http${host.startsWith('localhost') ? '' : 's'}://${host}${req.originalUrl.split(".php")[0]}`);
        const html = await response.text();
        res.send(html);
    });

    // Handling traffic not covered by the above routes
    if (is404Handler) {
        app.use((req, res) => {
            res.status(404).send('<html><body><h1>404 Not Found</h1><p>The requested resource was not found on this server.</p></body></html>');
        });
    }
}
