const express = require('express');
const fetch = require('node-fetch');

const fs = require("fs");
const sha256 = require('sha256');

const port = 5080; // Change this to the port of the server

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Log Format: Date - Ip - Browser - Method - Path - Status - User
// Exemple: 2024-11-20T14:19:37.295Z - 91.247.75.125 - Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 - GET /sss - 200 - 1

if(!fs.existsSync(`${__dirname}/traffic.txt`)) fs.writeFileSync(`${__dirname}/traffic.txt`, "");
if(!fs.existsSync(`${__dirname}/bots.txt`)) fs.writeFileSync(`${__dirname}/bots.txt`, "");

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

function getLogForIp(ip) {
    return fs.readFileSync(`${__dirname}/traffic.txt`, 'utf-8')
        .split("\n")
        .filter(log => log.split(" - ")[1] == ip)
        .filter(line=>!line.includes("/support"))
        .join("\n");
}

function getLogForIpUnknownPathOnly(ip, {knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}) {
    const logs = getLogForIp(ip);
    return logs.filter(log => !isKnownPath(log.split(" - ")[3],{knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}).isKnown);
}

//Check all requests of unknown path
function getAllBotsRequests({knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}, hashIp=false) {
    return fs.readFileSync(`${__dirname}/traffic.txt`, 'utf-8')
        .split("\n")
        .filter(log => log.includes("guest") && !isKnownPath(log.split(" - ")[3],{knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}).isKnown) // Filter out known paths
        .map(log => {
            let parts = log.split(" - ");
            const ip = parts[1];
            if(ip && hashIp) {
                const hashedIp = sha256(ip).slice(0, 10);
                parts[1] = hashedIp;
            }
            parts.pop();
            parts.shift();
            return parts.join(" - ");
        })
        // .sort()
        .join("\n");
}

function logTraffic(app, {knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}){
    // Traffic logging middleware
    app.use((req, res, next) => {
        fs.writeFileSync(`${__dirname}/bots.txt`, getAllBotsRequests({knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}));
        if(
            !req.originalUrl.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|webp)$/) &&
            req.originalUrl != "/support" &&
            req.headers['user-agent'] != "local-honeypot-tester"
        ) {
            const logLine = `${new Date().toISOString()} - ${req.headers['x-forwarded-for'] || req.ip} - ${req.headers['user-agent']} - ${req.method} ${req.originalUrl} - ${res.statusCode} - "guest"`
            console.log(logLine);
            fs.appendFile(`${__dirname}/traffic.txt`, logLine+"\n", 
                (err) => {
                    if(err) console.log(err);
                }
            );
        }
        next();
    });
}

// const responses = {
//     "admin": {
//         "/admin": {
//             "status": "Admin Interface active",
//             "description": "This endpoint serves admin interface."
//         },
//         "/manage/account/login": {
//             "status": "Account Management active",
//             "description": "This endpoint handles account management login."
//         },
//         "/admin/index.html": {
//             "status": "Admin Dashboard active",
//             "description": "This endpoint serves admin dashboard."
//         },
//         "/admin/webadmin": {
//             "status": "Web Admin active",
//             "description": "This endpoint serves web admin interface."
//         },
//         "/sitemap.xml": {
//             "status": "Sitemap active",
//             "description": "This endpoint serves sitemap."
//         }
//     },
//     "api": {
//         "/app/": {
//             "status": "App Endpoint active",
//             "description": "This endpoint serves app-related requests."
//         },
//         "/imei/": {
//             "status": "IMEI Endpoint active",
//             "description": "This endpoint handles IMEI-related requests."
//         },
//         "/homes/": {
//             "status": "Homes Endpoint active",
//             "description": "This endpoint serves homes-related requests."
//         },
//         "/mobile": {
//             "status": "Mobile Endpoint active",
//             "description": "This endpoint serves mobile-related requests."
//         },
//         "/dsxs/": {
//             "status": "DSXS Endpoint active",
//             "description": "This endpoint serves DSXS-related requests."
//         },
//         "/page/": {
//             "status": "Page Endpoint active",
//             "description": "This endpoint serves page-related requests."
//         },
//         "/getLocale": {
//             "status": "Get Locale active",
//             "description": "This endpoint retrieves the locale settings."
//         },
//         "/step1.asp": {
//             "status": "Step 1 ASP active",
//             "description": "This endpoint serves step 1 ASP requests."
//         },
//         "/site/info": {
//             "status": "Site Info active",
//             "description": "This endpoint provides site information."
//         },
//         "/home.html": {
//             "status": "Home HTML active",
//             "description": "This endpoint serves the home HTML page."
//         },
//         "/home/help": {
//             "status": "Home Help active",
//             "description": "This endpoint provides help for the home page."
//         },
//         "/api/banner?appKey=bxefdn": {
//             "status": "API Banner active",
//             "description": "This endpoint serves the API banner."
//         },
//         "/api/appVersion?mobile_system=2": {
//             "status": "API App Version active",
//             "description": "This endpoint retrieves the app version."
//         },
//         "/api/stock/getSingleStock.do?code=002405": {
//             "status": "API Single Stock active",
//             "description": "This endpoint retrieves a single stock's information."
//         },
//         "/wap/api/exchangerateuserconfig!get.action": {
//             "status": "WAP Exchange Rate active",
//             "description": "This endpoint retrieves exchange rate configurations."
//         },
//         "/api/v/index/queryOfficePage?officeCode=customHomeLink": {
//             "status": "API Office Page active",
//             "description": "This endpoint queries the office page."
//         },
//         "/api/admin/settings.php": {
//             "status": "API Admin Settings active",
//             "description": "This endpoint handles admin settings."
//         }
//     },
//     "assets": {
//         "/js/post.js/": "\n<html>\n<head>\n<title>Post JS Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Post JS Page</h1>\n<p>This page handles JavaScript for posting data.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/Public/Home/ecshe_css/main.css?v=1543997196": {
//             "status": "Main CSS File",
//             "description": "This endpoint serves the main CSS file for the public home."
//         },
//         "/Public/Mobile/ecshe_css/wapmain.css?v=1545408652": {
//             "status": "WAP Main CSS File",
//             "description": "This endpoint serves the main CSS file for WAP."
//         }
//     },
//     "config": {
//         "/api/common/config": {
//             "status": "Configuration Endpoint active",
//             "description": "This endpoint serves common configuration."
//         },
//         "/api/getCustomLink": {
//             "status": "Custom Link Endpoint active",
//             "description": "This endpoint retrieves custom links."
//         },
//         "/api/shares/hqStrList": {
//             "status": "HQ String List Endpoint active",
//             "description": "This endpoint serves HQ string list data."
//         },
//         "/data/json/config.json": {
//             "status": "JSON Config Endpoint active",
//             "description": "This endpoint serves JSON configuration data."
//         },
//         "/cx_platform/conf.json": {
//             "status": "CX Platform Config Endpoint active",
//             "description": "This endpoint serves CX platform configuration."
//         },
//         "/api/client/app/config.do": {
//             "status": "Client App Config Endpoint active",
//             "description": "This endpoint serves client application configuration."
//         },
//         "/static/data/thirdgames.json": {
//             "status": "Third Games Data Endpoint active",
//             "description": "This endpoint serves third games data."
//         },
//         "/template/mb/lang/text-zh.json": {
//             "status": "Chinese Language Template Endpoint active",
//             "description": "This endpoint serves the Chinese language template."
//         },
//         "/infe/rest/fig/advertise/common.json?mobile_open=1": {
//             "status": "Common Advertisement Data Endpoint active",
//             "description": "This endpoint serves common advertisement data."
//         },
//         "/meta.json": {
//             "status": "Meta Data Endpoint active",
//             "description": "This endpoint serves meta data."
//         },
//         "/wordpress/wp-admin/setup-config": {
//             "status": "WordPress Setup Config Endpoint active",
//             "description": "This endpoint serves WordPress setup configuration."
//         },
//         "/sellers.json": {
//             "status": "Sellers Data Endpoint active",
//             "description": "This endpoint serves sellers data."
//         },
//         "/config.xml": {
//             "status": "XML Config Endpoint active",
//             "description": "This endpoint serves XML configuration."
//         },
//         "/config/production.json": {
//             "status": "Production JSON Config Endpoint active",
//             "description": "This endpoint serves production JSON configuration."
//         },
//         "/config.yaml": {
//             "status": "YAML Config Endpoint active",
//             "description": "This endpoint serves YAML configuration."
//         },
//         "/config.yml": {
//             "status": "YAML Config Endpoint active",
//             "description": "This endpoint serves YAML configuration."
//         },
//         "/docker-compose.yml": {
//             "status": "Docker Compose Config Endpoint active",
//             "description": "This endpoint serves Docker Compose configuration."
//         },
//         "/cloud-config.yml": {
//             "status": "Cloud Config Endpoint active",
//             "description": "This endpoint serves cloud configuration."
//         },
//         "/config.json": {
//             "status": "JSON Config Endpoint active",
//             "description": "This endpoint serves JSON configuration."
//         },
//         "/secrets.json": {
//             "status": "Secrets JSON Endpoint active",
//             "description": "This endpoint serves secrets in JSON format."
//         },
//         "/api/.env": {
//             "status": "Environment Variables Endpoint active",
//             "description": "This endpoint serves environment variables."
//         },
//         "/user_secrets.yml": {
//             "status": "User Secrets YAML Endpoint active",
//             "description": "This endpoint serves user secrets in YAML format."
//         },
//         "/newTop": {
//             "status": "New Top Endpoint active",
//             "description": "This endpoint serves new top data."
//         },
//         "/t85TjsNn": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/KLFzmbdm": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/wpR2pHDz": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/fns-886-75.html": {
//             "status": "HTML Page Endpoint active",
//             "description": "This endpoint serves an HTML page."
//         },
//         "/262LBNFp": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/YRWnWHy7": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/N3qLdCWJ": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/n4TWwtZ4": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/T8LMdb3N": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/Q8RBNw4z": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/gpLFR5sr": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/6bXX29bt": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/tink_chat/": {
//             "status": "Tink Chat Endpoint active",
//             "description": "This endpoint serves Tink chat functionality."
//         },
//         "/5jshCV": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/Kd67Fq1x": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/G5LZ2X3k": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/LcMMvHcm": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/SP6YZWTP": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/sb": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/KQRDmgB": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/3vt4yTCT": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/bpffH5jB": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/n5cw4Z3Y": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/Kj5xBrWf": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/6tJmP253": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/zMmL28CN": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/C9KrpPhC": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/2MTXvx": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/n6PdMqLz": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/H6W7VRDj": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/q1gpDhK4": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/mhn8PLGw": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/qqWydpQ7": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/kPKzkZzY": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/fpyB8SZ3": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         }
//     },
//     "hidden": {
//         "/_vti_pvt/administrators.pwd": {
//             "status": "VTI Private Administrators Password",
//             "description": "This endpoint provides the VTI private administrators password."
//         },
//         "/_vti_pvt/authors.pwd": {
//             "status": "VTI Private Authors Password",
//             "description": "This endpoint provides the VTI private authors password."
//         },
//         "/_vti_pvt/service.pwd": {
//             "status": "VTI Private Service Password",
//             "description": "This endpoint provides the VTI private service password."
//         },
//         "/.aws/credentials": {
//             "status": "AWS Credentials File",
//             "description": "This endpoint serves the AWS credentials file."
//         },
//         "/.env": {
//             "status": "Environment Configuration File",
//             "description": "This endpoint serves the environment configuration file."
//         },
//         "/.env.production": {
//             "status": "Production Environment Configuration",
//             "description": "This endpoint serves the production environment configuration."
//         },
//         "/.git/config": {
//             "status": "Git Configuration",
//             "description": "This endpoint serves the Git configuration."
//         },
//         "/.git/HEAD": {
//             "status": "Git HEAD Reference",
//             "description": "This endpoint provides the Git HEAD reference."
//         },
//         "/.kube/config": {
//             "status": "Kubernetes Configuration",
//             "description": "This endpoint serves Kubernetes configuration."
//         },
//         "/.ssh/id_ecdsa": {
//             "status": "SSH ECDSA Key",
//             "description": "This endpoint serves the SSH ECDSA key."
//         },
//         "/.ssh/id_ed25519": {
//             "status": "SSH Ed25519 Key",
//             "description": "This endpoint serves the SSH Ed25519 key."
//         },
//         "/.ssh/id_rsa": {
//             "status": "SSH Private Key",
//             "description": "This endpoint serves the SSH private key."
//         },
//         "/.svn/wc.db": {
//             "status": "SVN Working Copy Database",
//             "description": "This endpoint serves the SVN working copy database."
//         },
//         "/.vscode/sftp.json": {
//             "status": "VSCode SFTP Configuration",
//             "description": "This endpoint serves SFTP configuration for VSCode."
//         },
//         "/.well-known/traffic-advice": {
//             "status": "Traffic Advice Well-Known Endpoint",
//             "description": "This endpoint provides traffic advice information."
//         }
//     },
//     "html": {
//         "/$web/index.html": "\n<html>\n<head>\n<title>Web Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Web Index Page</h1>\n<p>This page serves as the index for web services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/appxz/index.html": "\n<html>\n<head>\n<title>AppXZ Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>AppXZ Index Page</h1>\n<p>This page serves as the index for AppXZ services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/code1.html": "\n<html>\n<head>\n<title>Code 1 Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Code 1 Page</h1>\n<p>This page provides information about code 1.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/dist/index.html": "\n<html>\n<head>\n<title>Distribution Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Distribution Index Page</h1>\n<p>This page provides distribution information.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/dl1/index.html": "\n<html>\n<head>\n<title>DL1 Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>DL1 Index Page</h1>\n<p>This page serves as the index for DL1 services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/home/index.html": "\n<html>\n<head>\n<title>Home Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Home Index Page</h1>\n<p>This page serves as the home index.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/index/home/login.html": "\n<html>\n<head>\n<title>Home Login Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Home Login Page</h1>\n<p>Please enter your credentials to log in.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/index/police/index.html?agent=1000": "\n<html>\n<head>\n<title>Police Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Police Index Page</h1>\n<p>This page provides information about police services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/m.html": "\n<html>\n<head>\n<title>M Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>M Page</h1>\n<p>This page is designed for mobile users.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/market/market-ws/iframe.html": "\n<html>\n<head>\n<title>Market WS Iframe Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Market WS Iframe Page</h1>\n<p>This page provides market WS iframe information.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/mindex.html": "\n<html>\n<head>\n<title>M Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>M Index Page</h1>\n<p>This page serves as the index for mobile users.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/mobile/lists.html": "\n<html>\n<head>\n<title>Mobile Lists Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Mobile Lists Page</h1>\n<p>This page provides a list of mobile items.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/mobile/login.html": "\n<html>\n<head>\n<title>Mobile Login Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Mobile Login Page</h1>\n<p>Please enter your credentials to log in.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/Pay_Index.html": "\n<html>\n<head>\n<title>Pay Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Pay Index Page</h1>\n<p>This page handles payment processing.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/portal/index/protocol.html": "\n<html>\n<head>\n<title>Portal Protocol Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Portal Protocol Page</h1>\n<p>This page provides information about portal protocols.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/static/mobile/user.html": "\n<html>\n<head>\n<title>User Profile Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>User Profile Page</h1>\n<p>Details about the user profile will be displayed here.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>"
//     },
//     "mobile": {
//         "/m/": {
//             "status": "Mobile Interface active",
//             "description": "This endpoint serves mobile interface."
//         },
//         "/h5": {
//             "status": "H5 Interface active",
//             "description": "This endpoint serves H5 mobile interface."
//         },
//         "/wap/": {
//             "status": "WAP Interface active",
//             "description": "This endpoint serves WAP interface."
//         },
//         "/mobile/": {
//             "status": "Mobile Platform active",
//             "description": "This endpoint serves mobile platform interface."
//         },
//         "/mobile/index/home": {
//             "status": "Mobile Home active",
//             "description": "This endpoint serves mobile home page."
//         },
//         "/mobile/get_item_list": {
//             "status": "Mobile Item List active",
//             "description": "This endpoint provides mobile item listings."
//         },
//         "/m/allticker/1": {
//             "status": "Mobile Ticker active",
//             "description": "This endpoint serves mobile ticker data."
//         },
//         "/wap/forward": {
//             "status": "WAP Forward active",
//             "description": "This endpoint handles WAP forwarding."
//         },
//         "/mobile/v3/appSuperDownload.do": {
//             "status": "Mobile Super Download active",
//             "description": "This endpoint handles mobile app downloads."
//         }
//     },
//     "other": {
//         "/3ds1633693954432212": "\n<html>\n<head>\n<title>3DS Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>3DS Page</h1>\n<p>This page is related to 3D Secure transactions.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/8/": "\n<html>\n<head>\n<title>Page 8</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Page 8</h1>\n<p>This page provides information about page 8.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/ads.txt": {
//             "status": "Ads Text File",
//             "description": "This endpoint serves the ads text file."
//         },
//         "/ajax/allcoin_a/id/0?t=0.3782499195965951": {
//             "status": "All Coin API active",
//             "description": "This endpoint retrieves all coin data."
//         },
//         "/API/Web/chat.ashx": {
//             "status": "Web Chat API active",
//             "description": "This endpoint provides web chat functionalities."
//         },
//         "/app-ads.txt": {
//             "status": "App Ads Text File",
//             "description": "This endpoint serves the app ads text file."
//         },
//         "/app/api/app/get_index": {
//             "status": "App Get Index API active",
//             "description": "This endpoint retrieves the app index."
//         },
//         "/aws/credentials": {
//             "status": "AWS Credentials File",
//             "description": "This endpoint serves the AWS credentials file."
//         },
//         "/backup.sql": {
//             "status": "SQL Backup File",
//             "description": "This endpoint serves the SQL backup file."
//         },
//         "/backup.tar.gz": {
//             "status": "Backup TAR.GZ File",
//             "description": "This endpoint serves the backup TAR.GZ file."
//         },
//         "/backup.zip": {
//             "status": "Backup ZIP File",
//             "description": "This endpoint serves the backup ZIP file."
//         },
//         "/banner.do?code=1": "\n<html>\n<head>\n<title>Banner Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Banner Page</h1>\n<p>This page displays banner information.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/biz/server/config": {
//             "status": "Server Config API active",
//             "description": "This endpoint provides server configuration settings."
//         },
//         "/cdn-cgi/trace": {
//             "status": "CDN Trace Endpoint",
//             "description": "This endpoint provides tracing information for CDN."
//         },
//         "/client/api/findConfigByKey?configKey=level_config": {
//             "status": "Find Config By Key API active",
//             "description": "This endpoint retrieves configuration by key."
//         },
//         "/config/database": {
//             "status": "Database Configuration",
//             "description": "This endpoint serves the database configuration."
//         },
//         "/Ctrls/GetSysCoin": {
//             "status": "Get System Coin API active",
//             "description": "This endpoint retrieves system coin information."
//         },
//         "/database.sql": {
//             "status": "Database SQL File",
//             "description": "This endpoint serves the database SQL file."
//         },
//         "/dump.sql": {
//             "status": "SQL Dump File",
//             "description": "This endpoint serves the SQL dump file."
//         },
//         "/dwcc/configxLxn/inxfx": {
//             "status": "Config X Lxn API active",
//             "description": "This endpoint provides configuration for X Lxn."
//         },
//         "/env": {
//             "status": "Environment Configuration",
//             "description": "This endpoint provides environment configuration details."
//         },
//         "/env.production": {
//             "status": "Production Environment Configuration",
//             "description": "This endpoint serves the production environment configuration."
//         },
//         "/etc/shadow": {
//             "status": "Shadow Password File",
//             "description": "This endpoint serves the shadow password file."
//         },
//         "/etc/ssl/private/server.key": {
//             "status": "SSL Private Server Key",
//             "description": "This endpoint serves the SSL private server key."
//         },
//         "/f/user/index": "\n<html>\n<head>\n<title>User Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>User Index Page</h1>\n<p>This page provides the user index.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/feed": {
//             "status": "Feed Endpoint",
//             "description": "This endpoint serves the feed data."
//         },
//         "/fePublicInfo/": "\n<html>\n<head>\n<title>FE Public Info Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>FE Public Info Page</h1>\n<p>This page provides public information for FE services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/forerest/user/custSrv/findOne": {
//             "status": "Find One API active",
//             "description": "This endpoint retrieves a single customer service record."
//         },
//         "/friendGroup/list": "\n<html>\n<head>\n<title>Friend Group List Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Friend Group List Page</h1>\n<p>This page provides a list of friend groups.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/front/index/getSiteSetting": {
//             "status": "Get Site Setting API active",
//             "description": "This endpoint retrieves site settings."
//         },
//         "/getConfig/getArticle.do?code=1": {
//             "status": "Get Article API active",
//             "description": "This endpoint retrieves an article based on the provided code."
//         },
//         "/getConfig/listPopFrame.do?code=1&position=index&_=1601489645097": {
//             "status": "List Pop Frame API active",
//             "description": "This endpoint retrieves a list of pop frames based on the provided parameters."
//         },
//         "/git/config": {
//             "status": "Git Configuration",
//             "description": "This endpoint provides Git configuration details."
//         },
//         "/git/HEAD": {
//             "status": "Git HEAD Reference",
//             "description": "This endpoint provides the Git HEAD reference."
//         },
//         "/h5.2.taobao/": "\n<html>\n<head>\n<title>H5.2 Taobao Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>H5.2 Taobao Page</h1>\n<p>This page provides information about H5.2 Taobao services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/h5/": "\n<html>\n<head>\n<title>H5 Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>H5 Page</h1>\n<p>This page is designed for mobile H5 applications.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/Home/Get/getJnd28": {
//             "status": "Get Jnd28 API active",
//             "description": "This endpoint retrieves Jnd28 data."
//         },
//         "/Home/GetInitSource": {
//             "status": "Get Init Source API active",
//             "description": "This endpoint retrieves initial source data."
//         },
//         "/Home/Index/api": {
//             "status": "Home Index API active",
//             "description": "This endpoint provides home index API functionalities."
//         },
//         "/home/realtime/data": {
//             "status": "Realtime Data API active",
//             "description": "This endpoint provides real-time data."
//         },
//         "/htop": {
//             "status": "Htop API active",
//             "description": "This endpoint provides Htop functionalities."
//         },
//         "/iexchange/webtrader/": {
//             "status": "Web Trader API active",
//             "description": "This endpoint provides web trading functionalities."
//         },
//         "/im/": "\n<html>\n<head>\n<title>IM Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>IM Page</h1>\n<p>This page provides information about instant messaging services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/im/App/config": "\n<html>\n<head>\n<title>IM App Config Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>IM App Config Page</h1>\n<p>This page provides configuration for the IM application.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/index?lang=ja": {
//             "status": "Index API with Japanese Language active",
//             "description": "This endpoint retrieves index data in Japanese."
//         },
//         "/index/api/getweb": {
//             "status": "Get Web API active",
//             "description": "This endpoint retrieves web-related data."
//         },
//         "/index/aurl": "\n<html>\n<head>\n<title>Index AURL Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Index AURL Page</h1>\n<p>This page provides information about AURL indexing.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/index/index/getchatLog": {
//             "status": "Get Chat Log API active",
//             "description": "This endpoint retrieves chat logs."
//         },
//         "/index/index/home?business_id=1": {
//             "status": "Home API active",
//             "description": "This endpoint retrieves home page data for business ID 1."
//         },
//         "/index/index/info?type=ultimate&date=2": {
//             "status": "Index Info API active",
//             "description": "This endpoint retrieves index information based on type and date."
//         },
//         "/index/login/index": "\n<html>\n<head>\n<title>Login Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Login Index Page</h1>\n<p>This page allows users to log in.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/index/login/register": "\n<html>\n<head>\n<title>Login Register Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Login Register Page</h1>\n<p>This page allows users to register while logging in.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/index/user/register": "\n<html>\n<head>\n<title>User Registration Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>User Registration Page</h1>\n<p>This page allows users to register.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/jiaoyimao/": "\n<html>\n<head>\n<title>Jiaoyimao Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Jiaoyimao Page</h1>\n<p>This page provides information about Jiaoyimao services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/js/a.script": "\n<html>\n<head>\n<title>JavaScript A Script Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>JavaScript A Script Page</h1>\n<p>This page serves JavaScript for various functionalities.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/km.asmx/getPlatParam": {
//             "status": "Get Platform Param API active",
//             "description": "This endpoint retrieves platform parameters."
//         },
//         "/kube/config": {
//             "status": "Kubernetes Configuration",
//             "description": "This endpoint provides Kubernetes configuration details."
//         },
//         "/leftDao": {
//             "status": "Left DAO API active",
//             "description": "This endpoint provides left DAO functionalities."
//         },
//         "/mall/toget/banner": "\n<html>\n<head>\n<title>Mall Banner Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Mall Banner Page</h1>\n<p>This page displays banners for the mall.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/masterControl/getSystemSetting": {
//             "status": "Get System Setting API active",
//             "description": "This endpoint retrieves system settings."
//         },
//         "/melody/api/v1/pageconfig/list": {
//             "status": "Page Config List API active",
//             "description": "This endpoint retrieves a list of page configurations."
//         },
//         "/merchant/code": "\n<html>\n<head>\n<title>Merchant Code Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Merchant Code Page</h1>\n<p>This page provides information about merchant codes.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/merchant/z/payment/?order=1": "\n<html>\n<head>\n<title>Merchant Payment Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Merchant Payment Page</h1>\n<p>This page processes merchant payments.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/mytio/config/base": {
//             "status": "MyTio Base Config API active",
//             "description": "This endpoint provides MyTio base configuration."
//         },
//         "/otc/": "\n<html>\n<head>\n<title>OTC Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>OTC Page</h1>\n<p>This page provides information about OTC services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/other/getTopQuestion": {
//             "status": "Get Top Question API active",
//             "description": "This endpoint retrieves top questions."
//         },
//         "/phpinfo": {
//             "status": "PHP Info Page",
//             "description": "This endpoint provides PHP configuration information."
//         },
//         "/pro/qb365/": "\n<html>\n<head>\n<title>QB365 Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>QB365 Page</h1>\n<p>This page provides information about QB365 services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/procoin/config/all.do": {
//             "status": "Procoin Config API active",
//             "description": "This endpoint provides Procoin configuration settings."
//         },
//         "/proxy/games": "\n<html>\n<head>\n<title>Proxy Games Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Proxy Games Page</h1>\n<p>This page provides information about proxy games.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/public/api/index/config": {
//             "version": "2.0",
//             "appName": "API",
//             "description": "This endpoint provides public API configuration."
//         },
//         "/qs/": "\n<html>\n<head>\n<title>QS Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>QS Page</h1>\n<p>This page provides information about QS services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/room/getRoomBangFans": {
//             "status": "Get Room Bang Fans API active",
//             "description": "This endpoint retrieves room bang fans data."
//         },
//         "/s_api/basic/download/info": {
//             "status": "Download Info API active",
//             "description": "This endpoint provides download information."
//         },
//         "/server.key": {
//             "status": "Server Key File",
//             "description": "This endpoint serves the server key file."
//         },
//         "/setting/global": "\n<html>\n<head>\n<title>Global Settings Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Global Settings Page</h1>\n<p>This page provides global settings for the application.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/site/api/v1/site/vipExclusiveDomain/getGuestDomain": {
//             "status": "Get Guest Domain API active",
//             "description": "This endpoint retrieves guest domain information."
//         },
//         "/ssh/id_ecdsa": {
//             "status": "SSH ECDSA Key",
//             "description": "This endpoint serves the SSH ECDSA key."
//         },
//         "/ssh/id_ed25519": {
//             "status": "SSH Ed25519 Key",
//             "description": "This endpoint serves the SSH Ed25519 key."
//         },
//         "/ssh/id_rsa": {
//             "status": "SSH Private Key",
//             "description": "This endpoint serves the SSH private key."
//         },
//         "/stage-api/common/configKey/all": {
//             "status": "Common Config Key API active",
//             "description": "This endpoint retrieves all common configuration keys."
//         },
//         "/static/voice/default.wav": {
//             "status": "Default Voice File",
//             "description": "This endpoint serves the default voice file."
//         },
//         "/stock/mzhishu": "\n<html>\n<head>\n<title>Stock Mzhishu Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Stock Mzhishu Page</h1>\n<p>This page provides information about stock Mzhishu.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/support/index": "\n<html>\n<head>\n<title>Support Index Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Support Index Page</h1>\n<p>This page provides support information and resources.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/svn/wc.db": {
//             "status": "SVN Working Copy Database",
//             "description": "This endpoint serves the SVN working copy database."
//         },
//         "/unSecurity/app/config": {
//             "status": "Unsecurity App Config API active",
//             "description": "This endpoint provides unsecurity app configuration."
//         },
//         "/verification.asp": "\n<html>\n<head>\n<title>Verification Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Verification Page</h1>\n<p>This page handles verification requests.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/vti_pvt/administrators.pwd": {
//             "status": "VTI Private Administrators Password",
//             "description": "This endpoint provides the VTI private administrators password."
//         },
//         "/vti_pvt/authors.pwd": {
//             "status": "VTI Private Authors Password",
//             "description": "This endpoint provides the VTI private authors password."
//         },
//         "/vti_pvt/service.pwd": {
//             "status": "VTI Private Service Password",
//             "description": "This endpoint provides the VTI private service password."
//         },
//         "/wap": "\n<html>\n<head>\n<title>WAP Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>WAP Page</h1>\n<p>This page is designed for WAP services.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/web.config": {
//             "status": "Web Configuration File",
//             "description": "This endpoint serves the web configuration file."
//         },
//         "/well-known/discord": {
//             "status": "Discord Well-Known Endpoint",
//             "description": "This endpoint provides Discord-related information."
//         },
//         "/well-known/traffic-advice": {
//             "status": "Traffic Advice Well-Known Endpoint",
//             "description": "This endpoint provides traffic advice information."
//         }
//     },
//     "php": {
//         "/3ds.php": "\n<html>\n<head>\n<title>3DS PHP Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>3DS PHP Page</h1>\n<p>This page handles 3D Secure PHP requests.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/account_domain.php": "\n<html>\n<head>\n<title>Account Domain</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Account Domain</h1>\n<p>Domain configuration panel for accounts.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/admin/webadmin.php?mod=do&act=login": "\n<html>\n<head>\n<title>Admin Login Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Admin Login Page</h1>\n<p>Please enter your credentials to log in to the admin panel.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/config.php": {
//             "status": "PHP Configuration File",
//             "description": "This endpoint serves the PHP configuration file."
//         },
//         "/config/database.php": {
//             "status": "Database Configuration PHP",
//             "description": "This endpoint serves the database configuration in PHP format."
//         },
//         "/index.php?m=api&c=app&a=getPlatformConfig": {
//             "status": "Get Platform Config API active",
//             "description": "This endpoint retrieves platform configuration."
//         },
//         "/index.php/sign": "\n<html>\n<head>\n<title>Sign Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Sign Page</h1>\n<p>This page allows users to sign in.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/index.php/Wap/Api/getBanner": {
//             "status": "Get Banner API active",
//             "description": "This endpoint retrieves banner information for WAP."
//         },
//         "/leftDao.php?callback=jQuery183016740860980352856_1604309800583": {
//             "status": "Left DAO API active",
//             "description": "This endpoint provides left DAO functionalities."
//         },
//         "/phpinfo.php": {
//             "status": "PHP Info Page",
//             "description": "This endpoint provides PHP configuration information."
//         },
//         "/Public/initJs.php": "\n<html>\n<head>\n<title>Init JS Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>Init JS Page</h1>\n<p>This page initializes JavaScript functionalities.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>",
//         "/user/reg.php": "\n<html>\n<head>\n<title>User Registration Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>User Registration Page</h1>\n<p>This page allows users to register.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>"
//     },
//     "wordpress": {
//         "/wordpress/wp-admin/setup-config.php": {
//             "status": "WordPress Setup Config active",
//             "description": "This endpoint serves WordPress setup configuration."
//         },
//         "/wp-admin/setup-config.php": {
//             "status": "WP Admin Setup Config active",
//             "description": "This endpoint serves WP admin setup configuration."
//         },
//         "/wp-admin/admin-ajax": {
//             "status": "WordPress AJAX Handler active",
//             "description": "This endpoint handles WordPress AJAX requests."
//         },
//         "/wordpress/wp-content": {
//             "status": "WordPress Content Directory active",
//             "description": "This endpoint serves WordPress content files and media."
//         },
//         "/wp-admin": `\n<html>\n<head>\n<title>WP Admin Page</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>WP Admin Page</h1>\n<p>This page serves the WP admin interface.</p>\n<footer>\n<p>Powered by WordPress</p>\n</footer>\n</body>\n</html>`
//     },
//     "security": {
//         "/+CSCOE+/logon.html": {
//             "status": "CSCOE Logon Page active",
//             "description": "This endpoint serves the CSCOE logon interface."
//         },
//         "/cgi-bin/login.cgi": {
//             "status": "CGI Login active",
//             "description": "This endpoint handles CGI-based login requests."
//         },
//         "/logon.htm": {
//             "status": "Logon Page active",
//             "description": "This endpoint serves the logon interface."
//         },
//         "/login.jsp": {
//             "status": "JSP Login active",
//             "description": "This endpoint handles JSP-based login requests."
//         }
//     },
//     "content": {
//         "/about/": {
//             "status": "About Page active",
//             "description": "This endpoint serves about page content."
//         },
//         "/products/": {
//             "status": "Products Page active",
//             "description": "This endpoint serves products page content."
//         },
//         "/contact/": {
//             "status": "Contact Page active",
//             "description": "This endpoint serves contact page content."
//         },
//         "/blog": {
//             "status": "Blog Page active",
//             "description": "This endpoint serves blog content."
//         }
//     },
//     "system": {
//         "/logs": {
//             "status": "System Logs active",
//             "description": "This endpoint serves system logs."
//         },
//         "/cgi/conf.bin": {
//             "status": "CGI Config active",
//             "description": "This endpoint serves CGI configuration."
//         },
//         "/server-info": {
//             "status": "Server Information active",
//             "description": "This endpoint provides server status and configuration details."
//         },
//         "/hazelcast/rest/cluster": {
//             "status": "Hazelcast Cluster API active",
//             "description": "This endpoint provides Hazelcast cluster information."
//         },
//         "/nice%20ports%2C/Tri%6Eity.txt%2ebak": {
//             "status": "System File active",
//             "description": "This endpoint serves system backup files."
//         }
//     },
//     "vendor": {
//         "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php": {
//             "status": "PHPUnit Eval Stdin active",
//             "description": "This endpoint handles PHPUnit eval-stdin functionality."
//         },
//         "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin": {
//             "status": "PHPUnit Eval Stdin active",
//             "description": "This endpoint handles PHPUnit eval-stdin functionality."
//         }
//     },
//     "sber": {
//         "/sberchat008-prilca/": {
//             "status": "Sber Chat Interface active",
//             "description": "This endpoint serves Sber chat functionality."
//         },
//         "/sberbank-quiz-4": {
//             "status": "Sberbank Quiz active",
//             "description": "This endpoint serves Sberbank quiz content."
//         },
//         "/index_sber.php": {
//             "status": "Sber Index active",
//             "description": "This endpoint serves Sber index content."
//         }
//     },
//     "platform": {
//         "/a/": {
//             "status": "Platform A Interface active",
//             "description": "This endpoint serves platform A interface."
//         },
//         "/xy/": {
//             "status": "XY Platform active",
//             "description": "This endpoint serves XY platform interface."
//         },
//         "/platform": {
//             "status": "Main Platform Interface active",
//             "description": "This endpoint serves the main platform interface."
//         }
//     },
//     "numeric": {
//         "/999/": {
//             "status": "999 Interface active",
//             "description": "This endpoint serves the 999 interface."
//         },
//         "/888/": {
//             "status": "888 Interface active",
//             "description": "This endpoint serves the 888 interface."
//         }
//     },
//     "home": {
//         "/home/index": {
//             "status": "Home Index active",
//             "description": "This endpoint serves home index page."
//         }
//     },
//     "messaging": {
//         "/im/h5/": {
//             "status": "H5 Messaging Interface active",
//             "description": "This endpoint serves H5 messaging interface."
//         },
//         "/ddoo_im/": {
//             "status": "DDOO Messaging active",
//             "description": "This endpoint serves DDOO messaging platform."
//         }
//     },
//     "custom": {
//         "/jym-wn/": {
//             "status": "JYM-WN Interface active",
//             "description": "This endpoint serves JYM-WN interface."
//         },
//         "/acubu/": {
//             "status": "ACUBU Platform active",
//             "description": "This endpoint serves ACUBU platform."
//         }
//     },
//     "pages": {
//         "/pc.html": "\n<html>\n<head>\n<title>PC Version</title>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n</head>\n<body>\n<h1>PC Version</h1>\n<p>Desktop version of the platform.</p>\n</body>\n</html>",
//         "/z03.html": "\n<html>\n<head>\n<title>Z03 Page</title>\n</head>\n<body>\n<h1>Z03 Page</h1>\n<p>Z03 content.</p>\n</body>\n</html>",
//         "/ay-1.html": "\n<html>\n<head>\n<title>AY-1 Page</title>\n</head>\n<body>\n<h1>AY-1 Page</h1>\n<p>AY-1 content.</p>\n</body>\n</html>",
//         "/baidu.html": "\n<html>\n<head>\n<title>Baidu Page</title>\n</head>\n<body>\n<h1>Baidu Page</h1>\n<p>Baidu content.</p>\n</body>\n</html>"
//     },
//     "trading": {
//         "/kline/1m/1": {
//             "status": "Kline Chart active",
//             "description": "This endpoint provides 1-minute kline data."
//         }
//     },
//     "misc": {
//         "/index.php": {
//             "status": "PHP Index active",
//             "description": "This endpoint serves PHP index page."
//         },
//         "/index_sber": {
//             "status": "Sber Index active",
//             "description": "This endpoint serves Sber index page."
//         },
//         "/cabinet": {
//             "status": "Cabinet active",
//             "description": "This endpoint serves cabinet interface."
//         },
//         "/tcn/": {
//             "status": "TCN active",
//             "description": "This endpoint serves TCN interface."
//         },
//         "/.well-known/discord": {
//             "status": "Discord Well-Known active",
//             "description": "This endpoint serves Discord well-known data."
//         }
//     },
//     "landing": {
//         "/lander/sber/": {
//             "status": "Sber Landing active",
//             "description": "This endpoint serves Sber landing page."
//         },
//         "/lander/sber-fix/": {
//             "status": "Sber Fix Landing active",
//             "description": "This endpoint serves Sber fix landing page."
//         },
//         "/lander/test": {
//             "status": "Test Landing active",
//             "description": "This endpoint serves test landing page."
//         },
//         "/lander/1_offer_sber_chat_input_green_v3_nm": {
//             "status": "Sber Chat Landing active",
//             "description": "This endpoint serves Sber chat landing page."
//         },
//         "/lander/gpb_rus_short_obfs_nonetext/": {
//             "status": "GPB Landing active",
//             "description": "This endpoint serves GPB landing page."
//         },
//         "/lander/testsberv4_1703110539/": {
//             "status": "Test Sber V4 Landing active",
//             "description": "This endpoint serves test Sber V4 landing page."
//         },
//         "/lander/-w--sber-chat_1720439685": {
//             "status": "Sber Chat V2 Landing active",
//             "description": "This endpoint serves Sber chat V2 landing page."
//         },
//         "/lander/sberquiz-2223-3": {
//             "status": "Sber Quiz Landing active",
//             "description": "This endpoint serves Sber quiz landing page."
//         },
//         "/lander/05_042_offer_sber_chat_input_green_v3_nm": {
//             "status": "Sber Chat V3 Landing active",
//             "description": "This endpoint serves Sber chat V3 landing page."
//         },
//         "/lander/gp_newmain_calc_ru_land_obj_js_v2/index": {
//             "status": "GP Calculator Landing active",
//             "description": "This endpoint serves GP calculator landing page."
//         },
//         "/lander/sberchat5v4_tds_newcrm_028-vnutr/index": {
//             "status": "Sber Chat V4 Landing active",
//             "description": "This endpoint serves Sber chat V4 landing page."
//         },
//         "/lander/gazprom-prelandergnidanewkomment-thanksstory2-objv2/land/thank-you/": {
//             "status": "Gazprom Thanks Landing active",
//             "description": "This endpoint serves Gazprom thanks landing page."
//         },
//         "/lander/gazinvest-forma9maymadrid-thanksqz9may/thank-QZ/": {
//             "status": "Gazinvest Thanks Landing active",
//             "description": "This endpoint serves Gazinvest thanks landing page."
//         },
//         "/lander/sberchat5v4_tds_newcrm_038-vnutr_1721815245/index": {
//             "status": "Sber Chat V5 Landing active",
//             "description": "This endpoint serves Sber chat V5 landing page."
//         }
//     },
//     "authentication": {
//         "/index/login": {
//             "status": "Login active",
//             "description": "This endpoint handles user login."
//         }
//     },
//     "files": {
//         "/nnnnnnnnnnnnnnnnnnnnnnn": {
//             "status": "Unknown File active",
//             "description": "This endpoint serves an unknown file."
//         },
//         "/fake-wordpress.zip": {
//             "status": "Fake WordPress ZIP active",
//             "description": "This endpoint serves a fake WordPress ZIP file."
//         },
//         "/wp-config.php": {
//             "status": "WP Config active",
//             "description": "This endpoint serves the WordPress configuration file."
//         },
//         "/wp-config": {
//             "status": "WP Config active",
//             "description": "This endpoint serves the WordPress configuration."
//         },
//         "/doc/index.html": {
//             "status": "Documentation Index active",
//             "description": "This endpoint serves the documentation index."
//         }
//     },
//     "refresher": {
//         "/refresher?key=1ee446737f33c0ea497d": {
//             "status": "Refresher Key 1 active",
//             "description": "This endpoint serves refresher requests with key 1."
//         },
//         "/refresher?key=ddbb68bad9a9ae198089": {
//             "status": "Refresher Key 2 active",
//             "description": "This endpoint serves refresher requests with key 2."
//         },
//         "/refresher?key=67124aedc57197f9dba7": {
//             "status": "Refresher Key 3 active",
//             "description": "This endpoint serves refresher requests with key 3."
//         }
//     },
//     "quizzes": {
//         "/sberbank-quiz-v2/": {
//             "status": "Sberbank Quiz active",
//             "description": "This endpoint serves the Sberbank quiz."
//         },
//         "/tinkoff-v10-quiz/": {
//             "status": "Tinkoff Quiz active",
//             "description": "This endpoint serves the Tinkoff quiz."
//         }
//     },
//     "landers": {
//         "/lander/gp_newmain_calc_ru_land_obj_js_v2/index.php": {
//             "status": "GP New Main Calculator active",
//             "description": "This endpoint serves the GP new main calculator."
//         },
//         "/lander/testsberv4-copy--1/": {
//             "status": "Test Sber V4 Copy active",
//             "description": "This endpoint serves a copy of the test Sber V4."
//         },
//         "/lander/sberchat5v4_tds_newcrm_028-vnutr/index.php": {
//             "status": "Sber Chat V4 active",
//             "description": "This endpoint serves Sber chat V4."
//         },
//         "/lander/sberchat5v4_tds_newcrm_038-vnutr_1721815245/index.php": {
//             "status": "Sber Chat V5 active",
//             "description": "This endpoint serves Sber chat V5."
//         },
//         "/sbor_offerov/kripta/landing/lp_1/": {
//             "status": "Sbor Offer Landing active",
//             "description": "This endpoint serves the Sbor offer landing page."
//         }
//     },
//     "unknown": {
//         "/api/c/a": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/api/v1/member/kefu": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/api/index/webconfig": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/api/im/v2/app/config": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/api/config": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/api/apps/config": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         },
//         "/api/config/getkefu": {
//             "status": "Unknown Endpoint active",
//             "description": "This endpoint serves an unknown request."
//         }
//     },
//     "status": {
//         "/api/ping": {
//             "status": "Ping Endpoint active",
//             "description": "This endpoint checks the server status."
//         },
//         "/api/version": {
//             "status": "Version Endpoint active",
//             "description": "This endpoint provides the current version."
//         },
//         "/api/notice": {
//             "status": "Notice Endpoint active",
//             "description": "This endpoint serves notices."
//         }
//     },
//     "business": {
//         "/api/Business/": {
//             "status": "Business Endpoint active",
//             "description": "This endpoint serves business-related requests."
//         },
//         "/api/user/ismustmobile": {
//             "status": "User Mobile Check Endpoint active",
//             "description": "This endpoint checks if mobile is required for the user."
//         }
//     },
//     "data": {
//         "/api/shop/getKF": {
//             "status": "Shop KF Endpoint active",
//             "description": "This endpoint retrieves shop KF data."
//         },
//         "/api/front/index": {
//             "status": "Front Index Endpoint active",
//             "description": "This endpoint serves the front index."
//         },
//         "/api/home/customerService": {
//             "status": "Customer Service Endpoint active",
//             "description": "This endpoint serves customer service requests."
//         },
//         "/api/message/webInfo": {
//             "status": "Web Info Message Endpoint active",
//             "description": "This endpoint serves web information messages."
//         },
//         "/api/site/getInfo.do": {
//             "status": "Site Info Endpoint active",
//             "description": "This endpoint retrieves site information."
//         },
//         "/api/uploads/apimap": {
//             "status": "Upload API Map Endpoint active",
//             "description": "This endpoint serves the upload API map."
//         },
//         "/api/public/?service=Home.getConfig": {
//             "status": "Public Home Config Endpoint active",
//             "description": "This endpoint retrieves public home configuration."
//         },
//         "/api/system/systemConfigs/getCustomerServiceLink": {
//             "status": "System Configs Endpoint active",
//             "description": "This endpoint retrieves customer service link configurations."
//         },
//         "/api/unSecurity/app/listAppVersionInfo": {
//             "status": "App Version Info Endpoint active",
//             "description": "This endpoint lists app version information."
//         }
//     },
//     "video": {
//         "/api/Home/videoNew": {
//             "status": "New Video Endpoint active",
//             "description": "This endpoint serves new video content."
//         }
//     },
//     "event": {
//         "/api/Event/basic": {
//             "status": "Basic Event Endpoint active",
//             "description": "This endpoint serves basic event information."
//         }
//     },
//     "index": {
//         "/api/index/web": {
//             "status": "Web Index Endpoint active",
//             "description": "This endpoint serves the web index."
//         },
//         "/api/index/init": {
//             "status": "Index Init Endpoint active",
//             "description": "This endpoint initializes the index."
//         },
//         "/api/index/webconfig": {
//             "status": "Web Config Endpoint active",
//             "description": "This endpoint serves web configuration."
//         },
//         "/api/index/getConfig": {
//             "status": "Get Config Endpoint active",
//             "description": "This endpoint retrieves configuration."
//         },
//         "/api/index/grailindex": {
//             "status": "Grail Index Endpoint active",
//             "description": "This endpoint serves grail index data."
//         },
//         "/api/app/indexList": {
//             "status": "App Index List Endpoint active",
//             "description": "This endpoint serves the app index list."
//         }
//     },
//     "transaction": {
//         "/api/vue/transaction/config": {
//             "status": "Transaction Config Endpoint active",
//             "description": "This endpoint serves transaction configuration."
//         },
//         "/api/predict-whole-panel.do": {
//             "status": "Predict Whole Panel Endpoint active",
//             "description": "This endpoint predicts whole panel data."
//         },
//         "/api/currency/quotation_new": {
//             "status": "Currency Quotation Endpoint active",
//             "description": "This endpoint retrieves new currency quotations."
//         },
//         "/api/product/getPointStore": {
//             "status": "Point Store Endpoint active",
//             "description": "This endpoint retrieves point store data."
//         }
//     }
// }

const responses = {
    "admin": {
        "/admin": { "status": "Admin Interface active", "description": "Admin panel endpoint." },
        "/admin/index.html": { "status": "Admin Dashboard active", "description": "Admin dashboard." },
        "/api/admin/settings.php": { "status": "API Admin Settings active", "description": "Handles admin settings." }
    },
    "wordpress": {
        "/wp-admin": { "status": "WP Admin active", "description": "WordPress admin interface." },
        "/wp-config.php": { "status": "WP Config active", "description": "WordPress config file." },
        "/wordpress/wp-content": { "status": "WordPress Content active", "description": "WordPress content directory." }
    },
    "config": {
        "/config.yml": { "status": "YAML Config Endpoint active", "description": "YAML configuration file." },
        "/config.json": { "status": "JSON Config active", "description": "JSON configuration file." },
        "/docker-compose.yml": { "status": "Docker Compose Config active", "description": "Docker Compose file." },
        "/cloud-config.yml": { "status": "Cloud Config active", "description": "Cloud configuration file." },
        "/meta.json": { "status": "Meta Data active", "description": "Meta configuration file." }
    },
    "hidden": {
        "/.aws/credentials": { "status": "AWS Credentials active", "description": "AWS credentials file." },
        "/.env": { "status": "Environment Config active", "description": "Environment variables file." },
        "/.git/config": { "status": "Git Config active", "description": "Git configuration file." },
        "/.kube/config": { "status": "Kubernetes Config active", "description": "Kubernetes configuration file." }
    },
    "databases": {
        "/backup.sql": { "status": "SQL Backup active", "description": "Backup SQL file." },
        "/database.sql": { "status": "Database SQL active", "description": "Database SQL file." },
        "/dump.sql": { "status": "SQL Dump active", "description": "SQL dump file." }
    },
    "security": {
        "/etc/shadow": { "status": "Shadow Password File", "description": "Linux shadow password file." },
        "/etc/ssl/private/server.key": { "status": "SSL Private Key active", "description": "SSL server private key." },
        "/phpinfo.php": { "status": "PHP Info Page active", "description": "Displays PHP configuration." },
        "/server-info": { "status": "Server Info active", "description": "Displays server configuration." }
    },
    "misc": {
        // "/sitemap.xml": { "status": "Sitemap active", "description": "Site sitemap file." },
        "/.well-known/traffic-advice": { "status": "Traffic Advice active", "description": "Traffic advice endpoint." },
        "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php": { "status": "PHPUnit Eval active", "description": "Potential exploit for PHPUnit." }
    },
    "other": {}
}


const additionalEndpoints = [
    '/not_covered_endpoint_test' // must be un covered by responses variable, but doesnt show in the logs
]

// Console not covered additional endpoints by responses variables
let notCoveredAdditionalEndpoints = [];
for (const endpoint of additionalEndpoints) {
    Object.keys(responses).forEach(category => {
        if (!responses[category][endpoint]) {
            if(!notCoveredAdditionalEndpoints.includes(endpoint)) {
                notCoveredAdditionalEndpoints.push(endpoint);
            }
        }
    });
}

// Add additional endpoints to responses
notCoveredAdditionalEndpoints.forEach(endpoint => {
    responses["other"][endpoint] = { 
        status: 'Endpoint active', 
        description: `This endpoint is active and serves requests for ${endpoint}.` 
    };
});

function getUnhandledRoutes(routes, {knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}) {
    let unhandledRoutes = [];
    const botsRequests = getAllBotsRequests({knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}); // its a txt log file
    botsRequests.split('\n').forEach(botRequest => {
        const path = botRequest.split(" - ")[2]
            .replace(/^(GET|POST|DELETE|PUT|PATCH|HEAD) /, "")
            .trim();
        
        const isKnown = isKnownPath(path,{knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}).isKnown;
        console.log(path, isKnown)
        const isAdditionalEndpoint = additionalEndpoints.includes(path);
        let isResponseKey = false;
        Object.keys(responses).forEach(key => {
            Object.keys(responses[key]).forEach(responseKey => {
                if (responseKey.endsWith(path)) {
                    isResponseKey = true;
                }
            });
        });

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

// Update timestamps in responses object
Object.keys(responses).forEach(category => {
    Object.values(responses[category]).forEach(response => {
        if (response && typeof response === 'object' && response.timestamp) {
            response.timestamp = getCurrentTimestamp();
        }
    });
});

module.exports = (app, {
        is404Handler,
        logTraffic,
        knownPaths,
        knownApiPaths,
        knownPatterns,
        knownApiPatterns
    }) => {
    if(logTraffic) logTraffic(app);

    //console.log(knownPaths)

    Object.keys(responses).forEach(async key => {
        Object.keys(responses[key]).forEach(async path => {
            const response = responses[key][path];
            const isKnown = isKnownPath(path,{knownPaths, knownPatterns, knownApiPaths, knownApiPatterns}).isKnown
            if(isKnown) {
                return;
            }
            app.all(path,async  (req, res) => {
                // Handle new response formats
                if (typeof response === 'string') {
                    res.send(response);
                } else if (typeof response === 'object' && response !== null) {
                    response.timestamp = getCurrentTimestamp();
                    response.version = "1.0";
                    response.lastUpdated = "2023-10-01";
                    res.json(response);
                } else {
                    res.status(500).send('Invalid response format');
                }
            });
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
