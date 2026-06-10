export type Variant = "default" | "complete";
type Gen = (v: Variant) => string;

function ts(): string {
  return new Date().toISOString().replace(/\.\d{3}/, "");
}

function j(v: Variant, data: Record<string, unknown>): string {
  const base = v === "default"
    ? { code: 0, message: "ok" }
    : { success: true, code: 200, timestamp: ts(), request_id: `req_${Date.now().toString(36)}`, version: "2.4.1" };
  return JSON.stringify({ ...base, ...data }, null, 2);
}

function html(title: string, body: string): string {
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>`;
}

// ─── CREDENTIALS ────────────────────────────────────────────────────────────

function genEnv(v: Variant): string {
  return v === "default"
    ? "DB_HOST=localhost\nDB_USER=root\nDB_PASS=s3cur3P@ss\nAPP_ENV=development\nAPP_DEBUG=true"
    : `# Database\nDB_CONNECTION=mysql\nDB_HOST=db-master-01.internal.example.com\nDB_PORT=3306\nDB_DATABASE=production_app_v2\nDB_USER=admin_service\nDB_PASS=mM9k#2\\$xL!qR7pZ\n\n# Redis\nREDIS_HOST=redis-cluster-01.internal.example.com\nREDIS_PORT=6379\nREDIS_PASSWORD=R3d!s_S3cur3_K3y_2025\n\n# App\nAPP_ENV=production\nAPP_DEBUG=false\nAPP_URL=https://admin.internal.example.com\nAPP_KEY=base64:qJ3fR8mL2pX5vB7nC4kA9wE1yH6sD0tG\n\n# Mail\nMAIL_HOST=smtp.example.com\nMAIL_PORT=587\nMAIL_USERNAME=noreply@example.com\nMAIL_PASSWORD=Str0ng!M@ilP4ss\n\n# AWS\nAWS_ACCESS_KEY_ID=AKIA123456789EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\nAWS_DEFAULT_REGION=us-east-1\nAWS_S3_BUCKET=production-app-data\n\n# JWT\nJWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIn0.xYzABC123\nJWT_TTL=3600\n\n# API Keys\nSTRIPE_KEY=sk_live_4eC39HqLyjWDarjtT1zdp7dc\nSENDGRID_KEY=SG.xxxxyyyyzzzz.111222333444555666777888999000`;
}

function genEnvProduction(v: Variant): string {
  return v === "default"
    ? "NODE_ENV=production\nAPI_URL=https://api.example.com\nSENTRY_DSN=https://sentry.io/12345"
    : `# Production Environment\nNODE_ENV=production\nPORT=443\nAPI_URL=https://api.internal.example.com/v2\nSENTRY_DSN=https://abc123def456@sentry.example.com/42\nNEW_RELIC_LICENSE_KEY=NRAA-1234567890abcdef\nNEW_RELIC_APP_NAME=ProductionApp\n\n# Feature Flags\nFEATURE_NEW_PAYFLOW=true\nFEATURE_AI_RECOMMENDATIONS=false\nFEATURE_DARK_MODE=true\nMAINTENANCE_MODE=false\n\n# Rate Limiting\nRATE_LIMIT_WINDOW_MS=60000\nRATE_LIMIT_MAX_REQUESTS=100\nRATE_LIMIT_BLOCK_DURATION_MS=300000`;
}

function genAwsCredentials(v: Variant): string {
  return v === "default"
    ? "[default]\naws_access_key_id = AKIAIOSFODNN7EXAMPLE\naws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\nregion = us-west-2"
    : `[default]\naws_access_key_id = AKIAIOSFODNN7EXAMPLE\naws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\naws_session_token = IQoJb3JpZ2luX2VjEPv//////////wEaCXVzLXdlc3QtMiJIMEYCIQC6sX0FfVQBygrPpKdKXvQ7Ex1jPzT6tD0bKRxY6Tz5vAIhAKq+Rx5hF3iGzX8LOqJ9zVLHYPn2eO8R7d8g3qZ0ZqH6KmIIFBAAGgw1NTIxMDMzNjQ5NzciDOzqWJ6QqZ7s8eFm1yrzAuHWAw8Ej3CRIhR+Gv4c5H+NJVxNx9fH8yN/i0o7JvzYNsT3iA7h3KjPOfh3h+hVIwXH3MExLCHlMJnLJb70q0HH2h5b1V4FjKjEwYST7kRHaP+EEo3c7bXMSHOBXG48J0J+XUjh2m5KJbWnJeBOdz6RJkFRJX8/C6N9LBdYHf8pHu+KKY3EDCrhJwjIKZ6/0XJ2mODjJ0Z7mYF6qLDj6h0EqDGG8S9JVRt7g+L8Vd8PcS4bS8oXXFDqHjNnJYQUAw==\nregion = us-west-2\noutput = json\n\n[prod]\nrole_arn = arn:aws:iam::123456789012:role/ProductionAdmin\nsource_profile = default\nregion = eu-west-1`;
}

function genSecretsJson(v: Variant): string {
  return v === "default"
    ? JSON.stringify({ db_password: "P@ssw0rd!2025", api_key: "sk-proj-1234567890abcdef", jwt_secret: "my-super-secret-key-change-me" }, null, 2)
    : JSON.stringify({
      database: { host: "postgres-prod-1.internal", port: 5432, user: "app_service", password: "gH7#kL9$mN2$pQ5" },
      redis: { host: "redis-prod-1.internal", port: 6379, password: "R3d!sStr0ngK3y2025" },
      encryption: { key: "AES256-GCM-abc123def456ghi789jkl012", algorithm: "aes-256-gcm" },
      apis: { stripe: "sk_live_4eC39HqLyjWDarjtT1zdp7dc", sendgrid: "SG.xxxxyyyyzzzz.111222333444555666777888999000", twilio: "AC123abc456def789ghi012jkl345mno" },
      jwt: { secret: "eyJhbGciOiJSUzI1NiIsImtpZCI6InByb2QifQ.eyJzdWIiOiJzeXN0ZW0iLCJpYXQiOjE3MTc5MDAwMDB9.signature", ttl: 86400 },
      maintenance: { mode: false, bypass_ip: "10.0.0.1" },
    }, null, 2);
}

// ─── SSH / SYSTEM ──────────────────────────────────────────────────────────

function genSshKey(v: Variant, type: string): string {
  const key = `-----BEGIN ${type} PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1LxX4H7vJ9kR3c8f6t2s5b9g0qWpZmNvYxRzF6hC3L0\nu8mNvYxRzF6hC3L01LxX4H7vJ9kR3c8f6t2s5b9g0qWpZmNvYxRzF6hC3L0\nu8mNvYxRzF6hC3L01LxX4H7vJ9kR3c8f6t2s5b9g0qWpZmNvYxRzF6hC3L0\nu8mNvYxRzF6hC3L01LxX4H7vJ9kR3c8f6t2s5b9g0qWpZmNvYxRzF6hC3L0\nabc123def456ghi789jkl012mno345pqr678stu901vwx234yza\n-----END ${type} PRIVATE KEY-----`;
  return v === "default" ? key : key + `\n\n# Host: gitlab.internal.example.com\n# User: deploy-bot\n# Added: 2025-01-15\n# Expires: 2026-01-15`;
}

function genEtcShadow(v: Variant): string {
  return v === "default"
    ? "root:$y$j9T$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH:19712:0:99999:7:::"
    : `root:$y$j9T$6xL8pR2mN5vB7cQ9wE1yH3kT4nA6dF8gJ0sD2fG1hJ3kL5zX9cV7bN5m:19712:0:99999:7:::\ndaemon:*:19712:0:99999:7:::\nbin:*:19712:0:99999:7:::\nsys:*:19712:0:99999:7:::\nmail:*:19712:0:99999:7:::\nwww-data:$y$j9T$aB3cD5eF7gH9iJ1kL3mN5oP7qR9sT1uV3wX5yZ7:19712:0:99999:7:::\nmysql:!$6$xyzabc$defghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTU:19712:0:99999:7:::\ndeploy:$y$j9T$7kL9pR2mN5vB7cQ9wE1yH3kT4nA6dF8gJ0sD2fG1hJ3kL5zX9cV7bN5m:19715:0:99999:7:::`;
}

function genSslKey(v: Variant): string {
  const key = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDCy4KJ\n2X8pR3mN5vB7cQ9wE1yH3kT4nA6dF8gJ0sD2fG1hJ3kL5zX9cV7bN5m\n8pR3mN5vB7cQ9wE1yH3kT4nA6dF8gJ0sD2fG1hJ3kL5zX9cV7bN5m8pR3\n-----END PRIVATE KEY-----`;
  return v === "default" ? key : key + `\n\n# Certificate: *.example.com\n# Issuer: Let's Encrypt Authority X3\n# Expires: 2026-03-15 23:59:59 UTC\n# Key Strength: RSA 2048-bit`;
}

function genGitConfig(v: Variant): string {
  return v === "default"
    ? "[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n[remote \"origin\"]\n\turl = https://github.com/org/project.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*"
    : `[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tignorecase = true\n[remote "origin"]\n\turl = git@github.com:acmecorp/production-app.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n[branch "main"]\n\tremote = origin\n\tmerge = refs/heads/main\n[branch "develop"]\n\tremote = origin\n\tmerge = refs/heads/develop\n[user]\n\tname = DevOps Bot\n\temail = devops@example.com\n[github]\n\tuser = acmecorp\n\ttoken = ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`;
}

// ─── CONFIGS ────────────────────────────────────────────────────────────────

function genDatabaseConfig(v: Variant): string {
  return v === "default"
    ? JSON.stringify({ driver: "mysql", host: "localhost", database: "app_db", username: "root", password: "password" }, null, 2)
    : JSON.stringify({
      default: { driver: "mysql", host: "db-master-01.internal.example.com", port: 3306, database: "production_app", username: "app_admin", password: "aB3#dE5$fG7*hJ9", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", prefix: "app_", engine: "InnoDB" },
      redis: { driver: "redis", host: "redis-cluster-01.internal.example.com", port: 6379, password: "R3d!sK3y2025!", database: 0 },
      read_replica: { host: "db-replica-01.internal.example.com", port: 3306, database: "production_app", username: "app_readonly", password: "r34d0nly#P@ss" },
    }, null, 2);
}

function genPhpConfig(v: Variant): string {
  return v === "default"
    ? `<?php\ndefine('DB_NAME', 'wordpress');\ndefine('DB_USER', 'wp_user');\ndefine('DB_PASSWORD', 'wp_password');\ndefine('DB_HOST', 'localhost');\ndefine('AUTH_KEY', 'put your unique phrase here');\n?>`
    : `<?php\n/** Production WordPress Configuration */\ndefine('DB_NAME', 'production_wp_db');\ndefine('DB_USER', 'wp_admin_service');\ndefine('DB_PASSWORD', 'wP!s3cur3#K3y2025');\ndefine('DB_HOST', 'db-master-01.internal.example.com:3306');\ndefine('DB_CHARSET', 'utf8mb4');\ndefine('DB_COLLATE', 'utf8mb4_unicode_ci');\n\ndefine('AUTH_KEY', '6f8a7b9c0d1e2f3a4b5c6d7e8f9a0b1c');\ndefine('SECURE_AUTH_KEY', '9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d');\ndefine('LOGGED_IN_KEY', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d');\ndefine('NONCE_KEY', '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b');\n\ndefine('WP_HOME', 'https://admin.internal.example.com');\ndefine('WP_SITEURL', 'https://admin.internal.example.com');\ndefine('WP_DEBUG', false);\ndefine('DISALLOW_FILE_EDIT', true);\n\n$table_prefix = 'wp_prod_';\nif (!defined('ABSPATH')) define('ABSPATH', '/var/www/production/wp/');\nrequire_once ABSPATH . 'wp-settings.php';`;
}

function genDockerCompose(v: Variant): string {
  return v === "default"
    ? "version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - \"8080:80\"\n  db:\n    image: mysql:8.0\n    environment:\n      MYSQL_ROOT_PASSWORD: root"
    : `version: '3.8'\nservices:\n  app:\n    build:\n      context: .\n      dockerfile: Dockerfile.prod\n    image: registry.example.com/app:latest\n    container_name: production_app\n    restart: unless-stopped\n    ports:\n      - "443:443"\n    env_file:\n      - .env.production\n    volumes:\n      - ./storage/logs:/var/www/storage/logs\n    depends_on:\n      db:\n        condition: service_healthy\n      redis:\n        condition: service_started\n    networks:\n      - backend\n\n  db:\n    image: mysql:8.0.35\n    container_name: production_db\n    restart: unless-stopped\n    environment:\n      MYSQL_DATABASE: production_app\n      MYSQL_USER: app_service\n      MYSQL_PASSWORD: aB3#dE5\\$fG7*hJ9\n    volumes:\n      - db_data:/var/lib/mysql\n    networks:\n      - backend\n\n  redis:\n    image: redis:7.2-alpine\n    container_name: production_cache\n    restart: unless-stopped\n    command: redis-server --requirepass R3d!sK3y2025 --appendonly yes\n    volumes:\n      - redis_data:/data\n    networks:\n      - backend\n\nvolumes:\n  db_data:\n  redis_data:\n\nnetworks:\n  backend:\n    driver: bridge`;
}

function genHtaccess(v: Variant): string {
  return v === "default"
    ? "RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteRule ^ index.php [QSA,L]"
    : `# Apache Configuration for Production App\n<IfModule mod_rewrite.c>\n    RewriteEngine On\n    RewriteCond %{HTTPS} !=on\n    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]\n\n    RewriteRule ^\\.env - [F,L]\n    RewriteRule ^\\.git - [F,L]\n\n    RewriteCond %{REQUEST_FILENAME} !-f\n    RewriteCond %{REQUEST_FILENAME} !-d\n    RewriteRule ^ index.php [QSA,L]\n</IfModule>\n\n<FilesMatch "^\\.">\n    Require all denied\n</FilesMatch>`;
}

// ─── INFO PAGES ────────────────────────────────────────────────────────────

function genPhpInfo(v: Variant): string {
  return v === "default"
    ? JSON.stringify({ php_version: "8.1.12", server_software: "Apache/2.4.54 (Ubuntu)", loaded_extensions: ["mysqli", "curl", "mbstring", "gd", "xml", "json", "openssl"], memory_limit: "256M", max_execution_time: 30 }, null, 2)
    : JSON.stringify({
      PHP_VERSION: "8.1.12", SERVER_SOFTWARE: "Apache/2.4.54 (Ubuntu 22.04)", SERVER_NAME: "web-01.production.example.com",
      DOCUMENT_ROOT: "/var/www/production/current/public",
      LOADED_EXTENSIONS: ["mysqli", "curl", "mbstring", "gd", "xml", "json", "openssl", "pdo_mysql", "redis", "imagick", "bcmath", "zip", "intl", "sodium"],
      MEMORY_LIMIT: "512M", MAX_EXECUTION_TIME: 60, MAX_INPUT_TIME: 120, MAX_INPUT_VARS: 2000, POST_MAX_SIZE: "100M", UPLOAD_MAX_FILESIZE: "50M",
      SESSION_SAVE_PATH: "tcp://redis-cluster-01.internal:6379?auth=R3d!sK3y2025",
      OPCODE_CACHE: "OPcache v8.1.12", APCu: "5.1.22",
    }, null, 2);
}

function genServerInfo(v: Variant): string {
  return v === "default"
    ? JSON.stringify({ server_software: "Apache/2.4.41 (Ubuntu)", server_admin: "admin@example.com", document_root: "/var/www/html", uptime: "45 days" }, null, 2)
    : JSON.stringify({
      SERVER_SOFTWARE: "nginx/1.24.0", SERVER_NAME: "web-01.prod.example.com", SERVER_ADMIN: "sysadmin@example.com",
      SERVER_ADDR: "10.0.12.45", SERVER_PORT: 443, DOCUMENT_ROOT: "/var/www/production/current/public",
      UPTIME: "127 days, 3 hours, 42 minutes", LOAD_AVERAGE: [0.45, 0.32, 0.28],
      MEMORY_USAGE: { total: "32GB", used: "24.5GB", free: "7.5GB" },
      CPU_MODEL: "Intel(R) Xeon(R) Gold 6248R @ 3.00GHz", CPU_CORES: 32, KERNEL: "5.15.0-91-generic",
    }, null, 2);
}

// ─── SQL ───────────────────────────────────────────────────────────────────

function genSql(v: Variant): string {
  const prefix = v === "default" ? "" : "production_";
  return v === "default"
    ? `-- MySQL Dump\n-- Generated: ${ts()}\n\nCREATE TABLE IF NOT EXISTS \`users\` (\n  \`id\` int(11) NOT NULL AUTO_INCREMENT,\n  \`username\` varchar(255) NOT NULL,\n  \`password_hash\` varchar(255) NOT NULL,\n  \`email\` varchar(255) DEFAULT NULL,\n  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\nINSERT INTO \`users\` (\`username\`, \`password_hash\`, \`email\`) VALUES\n('admin', '\\$2y\\$10\\$abcdefghijklmnopqrstuvwx', 'admin@example.com');`
    : `-- MySQL Dump for ${prefix}app\n-- Generated: ${ts()}\n-- Server: 8.0.35-0ubuntu0.22.04.1\n\nCREATE DATABASE IF NOT EXISTS \`${prefix}app\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE \`${prefix}app\`;\n\nCREATE TABLE \`users\` (\n  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n  \`uuid\` char(36) NOT NULL,\n  \`username\` varchar(255) NOT NULL,\n  \`password_hash\` varchar(255) NOT NULL,\n  \`email\` varchar(255) NOT NULL,\n  \`role\` enum('admin','user','moderator') NOT NULL DEFAULT 'user',\n  \`status\` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',\n  \`last_login_at\` timestamp NULL DEFAULT NULL,\n  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`),\n  UNIQUE KEY \`users_uuid_unique\` (\`uuid\`),\n  UNIQUE KEY \`users_username_unique\` (\`username\`),\n  UNIQUE KEY \`users_email_unique\` (\`email\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nINSERT INTO \`users\` (\`uuid\`, \`username\`, \`password_hash\`, \`email\`, \`role\`, \`status\`) VALUES\n('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin', '\\$2y\\$12\\$LJ3m8qX5Rp7NvBc9wE1yH', 'admin@example.com', 'admin', 'active'),\n('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'john.doe', '\\$2y\\$12\\$aB3cD5eF7gH9iJ1kL3mN5oP', 'john@example.com', 'user', 'active'),\n('c3d4e5f6-a7b8-9012-cdef-123456789012', 'jane.smith', '\\$2y\\$12\\$mN5oP7qR9sT1uV3wX5yZ7a', 'jane@example.com', 'user', 'active');\n\nCREATE TABLE \`products\` (\n  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n  \`sku\` varchar(50) NOT NULL,\n  \`name\` varchar(255) NOT NULL,\n  \`price\` decimal(10,2) NOT NULL,\n  \`stock\` int(11) NOT NULL DEFAULT 0,\n  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`),\n  UNIQUE KEY \`products_sku_unique\` (\`sku\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nINSERT INTO \`products\` (\`sku\`, \`name\`, \`price\`, \`stock\`) VALUES\n('SKU-001', 'Product A', 29.99, 100),\n('SKU-002', 'Product B', 49.99, 250),\n('SKU-003', 'Product C', 99.99, 50);`;
}

// ─── HTML PAGES ────────────────────────────────────────────────────────────

function genAdminPage(v: Variant): string {
  if (v === "default") {
    return html("Admin Panel", `<h1>Administration Panel</h1>\n<form method="POST" action="/admin/login">\n<p><input type="text" name="username" placeholder="Username"></p>\n<p><input type="password" name="password" placeholder="Password"></p>\n<p><button type="submit">Sign In</button></p>\n</form>`);
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Admin Panel v3.2.1 — Production Management Console</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
body{background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:rgba(255,255,255,.95);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.3);width:420px;padding:40px}
.card h1{color:#1a1a2e;font-size:24px;text-align:center;margin-bottom:4px}
.card .sub{color:#666;font-size:13px;text-align:center;margin-bottom:24px}
.card label{display:block;margin-bottom:6px;color:#333;font-size:14px}
.card input{width:100%;padding:12px 16px;border:2px solid #e1e1e1;border-radius:8px;font-size:14px;margin-bottom:16px}
.card input:focus{outline:none;border-color:#0f3460}
.card button{width:100%;padding:12px;background:#0f3460;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer}
.card button:hover{background:#1a1a2e}
.card .footer{text-align:center;margin-top:16px;color:#999;font-size:12px}
</style>
</head>
<body>
<div class="card">
<h1>Production Management Console</h1>
<p class="sub">Enterprise Administration Panel v3.2.1</p>
<form method="POST" action="/admin/login">
<label>Username</label>
<input type="text" name="username" autocomplete="username" required>
<label>Password</label>
<input type="password" name="password" autocomplete="current-password" required>
<button type="submit">Sign In to Dashboard</button>
</form>
<p class="footer">&copy; 2025 ACME Corp &mdash; Build prod-3.2.1.892</p>
</div>
</body>
</html>`;
}

function genWpAdmin(v: Variant): string {
  if (v === "default") {
    return html("WordPress &rsaquo; Login",
      `<h1>WordPress</h1>\n<form method="POST" action="/wp-login.php">\n<p><input type="text" name="log" placeholder="Username"></p>\n<p><input type="password" name="pwd" placeholder="Password"></p>\n<p><button type="submit">Log In</button></p>\n</form>`);
  }
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>WordPress &#8250; Login</title>
<style>
*{box-sizing:border-box}html{background:#f0f0f1}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
#login{width:320px;padding:8% 0 0}
.box{background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.box h1{text-align:center;color:#3c434a;font-size:20px;font-weight:400;margin-bottom:24px}
.box label{display:block;margin-bottom:4px;color:#3c434a;font-size:14px}
.box input[type="text"],.box input[type="password"]{width:100%;padding:8px 12px;border:1px solid #8c8f94;border-radius:4px;font-size:16px;margin-bottom:16px}
.box input:focus{border-color:#2271b1;box-shadow:0 0 0 1px #2271b1;outline:none}
.box button{background:#2271b1;border:none;color:#fff;padding:10px 24px;border-radius:4px;font-size:14px;cursor:pointer;width:100%}
.box button:hover{background:#135e96}
.box .remember{margin-bottom:16px;font-size:13px}
</style>
</head>
<body>
<div id="login">
<div class="box">
<h1>WordPress</h1>
<form name="loginform" method="POST" action="/wp-login.php">
<p>
<label for="user_login">Username or Email</label>
<input type="text" name="log" id="user_login" autocomplete="username" required>
</p>
<p>
<label for="user_pass">Password</label>
<input type="password" name="pwd" id="user_pass" autocomplete="current-password" required>
</p>
<p class="remember"><label><input name="rememberme" type="checkbox" value="forever"> Remember Me</label></p>
<p><button type="submit">Log In</button></p>
</form>
</div>
</div>
</body>
</html>`;
}

function genGenericPage(v: Variant, title: string, heading: string): string {
  return v === "default"
    ? JSON.stringify({ status: `${heading} active`, description: `This endpoint serves ${heading.toLowerCase()} content.` }, null, 2)
    : html(title, `<header><h1>${heading}</h1></header><main><p>Welcome to ACME Corporation. We are a leading provider of innovative solutions for businesses worldwide.</p><p>For more information, contact us at info@example.com or call +1 (555) 123-4567.</p></main><footer>&copy; 2025 ACME Corporation</footer>`);
}

function genLoginPage(v: Variant, system: string): string {
  if (v === "default") {
    return html(`${system} Login`, `<h1>${system}</h1><form method="POST"><input type="text" name="username" placeholder="Username"><input type="password" name="password" placeholder="Password"><button type="submit">Login</button></form>`);
  }
  return html(`${system} — Sign In`,
    `<div style="max-width:380px;margin:40px auto;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.15);padding:32px">
<h1 style="font-size:22px;margin-bottom:8px;color:#333">${system}</h1>
<p style="color:#666;font-size:13px;margin-bottom:24px">Please enter your credentials</p>
<form method="POST">
<input type="text" name="username" placeholder="Username" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:4px;margin-bottom:16px" required>
<input type="password" name="password" placeholder="Password" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:4px;margin-bottom:16px" required>
<button type="submit" style="width:100%;padding:10px;background:#0066cc;color:#fff;border:none;border-radius:4px;font-size:14px;cursor:pointer">Sign In</button>
</form>
<p style="font-size:12px;color:#999;text-align:center;margin-top:16px">Secured by TLS 1.3</p>
</div>`);
}

function genLanding(v: Variant, bank: string): string {
  if (v === "default") {
    return JSON.stringify({ status: "Landing page active", bank, redirect_url: `https://${bank.toLowerCase()}.example.com/auth` }, null, 2);
  }
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${bank} — Вход в систему</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Roboto,sans-serif}
body{background:#f0f2f5;display:flex;flex-direction:column;align-items:center;min-height:100vh}
.top{width:100%;background:#fff;padding:12px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.top .in{max-width:1000px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:12px}
.top .name{font-size:20px;font-weight:700;color:#1a1a2e}
.top .badge{margin-left:auto;font-size:12px;color:#28a745}
.card{background:#fff;border-radius:12px;box-shadow:0 2px 20px rgba(0,0,0,.08);max-width:440px;width:100%;margin:40px 20px;padding:36px}
.card h2{font-size:22px;margin-bottom:8px;color:#1a1a2e}
.card p{color:#666;font-size:14px;margin-bottom:24px}
.card input{width:100%;padding:12px 16px;border:2px solid #e1e5ea;border-radius:8px;font-size:15px;margin-bottom:16px}
.card input:focus{border-color:#0066cc;outline:none}
.card .row{display:flex;gap:12px}
.card .row input{flex:1}
.card .btn{width:100%;padding:14px;background:#0066cc;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer}
.card .btn:hover{background:#0052a3}
.card .legal{font-size:11px;color:#999;text-align:center;margin-top:20px}
.footer{margin-top:auto;padding:20px;font-size:12px;color:#999;text-align:center;width:100%}
</style>
</head>
<body>
<div class="top"><div class="in"><div class="name">${bank}</div><div class="badge">&#x1f512; Защищенное соединение</div></div></div>
<div class="card">
<h2>Вход в интернет-банк</h2>
<p>Для доступа к вашему счету введите данные для входа</p>
<form method="POST">
<input type="text" name="login" placeholder="Номер карты или логин" autocomplete="username" required>
<input type="password" name="password" placeholder="Пароль" autocomplete="current-password" required>
<div class="row">
<input type="text" name="sms_code" placeholder="Код из SMS" maxlength="6">
<input type="text" name="cvv" placeholder="CVV2" maxlength="3">
</div>
<button type="submit" class="btn">Войти</button>
</form>
<div class="legal">Никогда не сообщайте свои данные третьим лицам.</div>
</div>
<div class="footer">${bank} &copy; 2025</div>
</body>
</html>`;
}

// ─── SMART FALLBACK GENERATORS ──────────────────────────────────────────────

function genC2Heartbeat(v: Variant, ep: string): string {
  const agentId = ep.replace("/", "").slice(0, 8);
  if (v === "default") {
    return JSON.stringify({ status: "ok", agent_id: agentId, task: "heartbeat", interval: 60 }, null, 2);
  }
  return JSON.stringify({
    status: "ok", agent_id: agentId, group: "production-botnet", version: "3.1.2",
    uptime: Math.floor(Math.random() * 86400 * 30), tasks_pending: 0,
    server_time: ts(), commands: [], next_checkin: Math.floor(Math.random() * 300) + 30,
    system: { os: "Linux", arch: "x86_64", hostname: `node-${agentId}.internal` },
  }, null, 2);
}

function genShortPath(v: Variant, name: string): string {
  const pages: Record<string, [string, string] | undefined> = {
    "/feed": ["Feed", "Activity Feed"],
    "/h5": ["H5", "Mobile Page"],
    "/htop": ["HTOP", "Server Monitor"],
    "/imei": ["IMEI", "Device Check"],
    "/logs": ["Logs", "System Logs"],
    "/otc": ["OTC", "Over-the-Counter Trading"],
    "/refresher": ["Refresher", "Auto Refresh"],
    "/sb": ["SB", "Service Board"],
    "/tcn": ["TCN", "Token Check"],
    "/xy": ["XY", "Info Page"],
    "/a": ["A-Service", "Service A"],
    "/8": ["Status", "Status Page"],
    "/888": ["Admin Portal", "Administration Portal"],
    "/999": ["Emergency", "Emergency Dashboard"],
    "/banner.do": ["Banner", "Banner Service"],
    "/fePublicInfo": ["Public Info", "Public Information"],
    "/newTop": ["Top Items", "Leaderboard"],
    "/qs": ["QS", "Quick Search"],
  };
  const [title, heading] = pages[name] ?? [name.replace("/", "").toUpperCase(), name.replace("/", "")];
  return v === "default"
    ? JSON.stringify({ status: `${heading} active`, description: `Service: ${heading}` }, null, 2)
    : html(title, `<h1>${heading}</h1><main><p>Service endpoint active. Last checked: ${ts()}</p><p>Status: operational</p></main>`);
}

function genScannerPath(v: Variant, ep: string): string {
  if (ep.includes("nice%20ports") || ep.includes("Tri%6Eity")) {
    return v === "default"
      ? "Can't connect to database"
      : "Host: db-01\nPort: 3306\nDatabase: mysql\nStatus: connected\nUsers connected: 3\n\n-- Access granted --\nSELECT * FROM users LIMIT 5;\nadmin | * | admin@example.com\njohn | * | john@example.com";
  }
  if (ep.includes("hazelcast/rest/cluster")) {
    return v === "default"
      ? "Hazelcast Cluster: 3 nodes"
      : JSON.stringify({ members: [{ address: "10.0.1.10:5701", uuid: "abc-123" }, { address: "10.0.1.11:5701", uuid: "def-456" }, { address: "10.0.1.12:5701", uuid: "ghi-789" }], connectionCount: 42, clientCount: 15 }, null, 2);
  }
  if (ep.includes("cgi/conf.bin")) {
    return v === "default"
      ? "CONFIG: DEBUG_MODE=1\nADMIN_PASS=admin"
      : "SYSTEM CONFIGURATION\n[network]\nip=10.0.0.1\nmask=255.255.255.0\ngateway=10.0.0.254\n\n[admin]\npassword_hash=21232f297a57a5a743894a0e4a801fc3\nsession_timeout=3600\n\n[services]\nhttpd=1\nftpd=1\ntelnetd=0\nsnmpd=1\n\n[snmp]\ncommunity=public\n";
  }
  return j(v, { alert: "Suspicious activity detected", source_ip: "45.33.32.156", severity: "medium" });
}

function genChineseApi(v: Variant, ep: string): string {
  if (v === "default") {
    return JSON.stringify({ code: 200, msg: "成功", data: null }, null, 2);
  }
  return JSON.stringify({
    code: 200, msg: "成功", success: true, timestamp: Date.now(),
    data: { items: [], total: 0, page: 1, pageSize: 20 },
    server: "C2C/1.0", requestId: `req_${Date.now().toString(36)}`,
  }, null, 2);
}

function genMerchant(v: Variant, ep: string): string {
  if (v === "default") return j(v, { merchant_id: "MCH-001", status: "active" });
  return j(v, { merchant_id: "MCH-2025-8912", status: "approved", tier: "premium", balance: 1250000, currency: "USDT", fee_rate: "0.1%", daily_volume_limit: 500000 });
}

function genCatchall(v: Variant, ep: string): string {
  const depth = ep.split("/").filter(Boolean).length;
  const segments = ep.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "";
  const second = segments.length > 1 ? segments[segments.length - 2] : "";
  const hasNums = /\d/.test(last);
  const looksLikeId = /^[a-f0-9]{8,}$/i.test(last.replace(/[^a-f0-9]/gi, ""));

  if (looksLikeId || hasNums) {
    return genC2Heartbeat(v, ep);
  }
  if (depth === 1) {
    const label = last.replace(/^\w/, (c) => c.toUpperCase());
    return genGenericPage(v, label, label);
  }
  if (v === "default") {
    return JSON.stringify({
      code: 0, message: "ok",
      data: { type: last, module: second, status: "active" },
    }, null, 2);
  }
  return JSON.stringify({
    success: true, code: 200, timestamp: ts(),
    request_id: `req_${Date.now().toString(36)}`,
    data: { type: last, module: second, status: "active", updated_at: ts() },
    meta: { page: 1, pageSize: 20, total: segments.length > 2 ? 42 : 0 },
  }, null, 2);
}

// ─── CLASSIFIER ─────────────────────────────────────────────────────────────

function classify(endpoint: string): Gen | null {
  const e = endpoint;

  if (e === "/") return (v) => genGenericPage(v, "Home", "Home");

  if (e === "/.env" || e === "/env" || e === "/api/.env") return genEnv;
  if (e === "/.env.production" || e === "/env.production") return genEnvProduction;

  if (e === "/.aws/credentials" || e === "/aws/credentials") return genAwsCredentials;

  if (e.includes("id_rsa")) return (v) => genSshKey(v, "RSA");
  if (e.includes("id_ecdsa")) return (v) => genSshKey(v, "ECDSA");
  if (e.includes("id_ed25519")) return (v) => genSshKey(v, "ED25519");

  if (e.endsWith("secrets.json") || e.endsWith("secrets.yml") || e.endsWith("secrets.yaml")) return genSecretsJson;

  if (e.includes("/config/database") && !e.endsWith(".php")) return genDatabaseConfig;
  if (e === "/config/production.json") return (v) => j(v, { environment: "production", region: "us-east-1" });

  if (e.endsWith("wp-config.php") || e.endsWith("wp-config")) return genPhpConfig;
  if (e.endsWith("config.php")) return (v) => `<?php\nreturn ['app' => ['name' => 'App', 'env' => '${v === "default" ? "dev" : "production"}']];\n?>`;

  if (e.endsWith(".git/config") || e.endsWith("git/config")) return genGitConfig;
  if (e.endsWith(".git/HEAD") || e.endsWith("git/HEAD")) return (v) => `ref: refs/heads/${v === "default" ? "main" : "develop"}\n`;

  if (e.includes(".kube/config") || e.includes("kube/config")) return (v) => v === "default"
    ? j(v, { current_context: "minikube" })
    : `apiVersion: v1\nclusters:\n- cluster:\n    server: https://k8s-prod.example.com:6443\n    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t\n  name: prod\ncontexts:\n- context:\n    cluster: prod\n    user: admin\n  name: prod\ncurrent-context: prod\nusers:\n- name: admin\n  user:\n    token: eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50In0.signature\n`;

  if (e.endsWith("etc/shadow")) return genEtcShadow;
  if (e.endsWith("etc/ssl/private/server.key") || e.endsWith("server.key")) return genSslKey;

  if (e.includes("phpinfo") || e.endsWith("phpinfo.php")) return genPhpInfo;
  if (e.includes("server-info") || e.includes("server_info")) return genServerInfo;

  if (e.endsWith("dump.sql") || e.endsWith("backup.sql") || e.endsWith("database.sql")) return genSql;

  if (e.endsWith("docker-compose.yml")) return genDockerCompose;

  if (e.endsWith(".htaccess") || e.endsWith("htaccess")) return genHtaccess;

  if (e.endsWith("web.config")) return genHtaccess;

  if (e === "/admin" || e === "/admin/webadmin" || e === "/admin/index.html") return genAdminPage;

  if (e.includes("wp-admin") || e.includes("/wordpress/")) return genWpAdmin;

  if (e.endsWith("login.jsp")) return (v) => genLoginPage(v, "JSP Portal");
  if (e.match(/logon\.(htm|html)/)) return (v) => genLoginPage(v, "Secure Logon");
  if (e.includes("cgi-bin/login")) return (v) => genLoginPage(v, "CGI Authentication");
  if (e.endsWith("step1.asp")) return (v) => genLoginPage(v, "ASP Step Verification");
  if (e.endsWith("verification.asp")) return (v) => genLoginPage(v, "Identity Verification");

  if (["/about", "/blog", "/contact", "/products", "/cabinet", "/platform", "/page"].includes(e)) {
    const label = e.replace("/", "").replace(/^\w/, (c) => c.toUpperCase());
    return (v) => genGenericPage(v, label, label);
  }
  if (["/home.html", "/m.html", "/mindex.html", "/pc.html", "/index.html"].includes(e)) {
    return (v) => genGenericPage(v, "Home", "Home Page");
  }

  if (e.includes("sber") || e.includes("tinkoff") || e.includes("gazprom") || e.includes("sberbank")) {
    const bank = e.includes("sber") || e.includes("sberbank") ? "СберБанк" : e.includes("tinkoff") ? "Тинькофф Банк" : "Газпромбанк";
    return (v) => genLanding(v, bank);
  }
  if (e.includes("/lander/")) return (v) => genLanding(v, "Банк");

  if (e.endsWith("config.yml") || e.endsWith("config.yaml")) return (v) => `app:\n  name: Application\n  env: ${v === "default" ? "development" : "production"}\n  debug: ${v === "default"}\n`;
  if (e.endsWith("config.xml")) return (v) => `<configuration><app><name>Application</name><env>${v === "default" ? "dev" : "prod"}</env></app></configuration>`;
  if (e.endsWith("config.json") || e.endsWith("meta.json")) return (v) => j(v, { environment: v === "default" ? "dev" : "production" });
  if (e.endsWith("cloud-config.yml")) return (v) => `#cloud-config\npackage_upgrade: ${v !== "default"}\ntimezone: UTC\npackages:\n  - nginx\n  - mysql-server\n`;

  if (e.includes("cdn-cgi/trace")) return (v) => v === "default"
    ? "visit_scheme=https\ncolo=LAX\nip=203.0.113.1\n"
    : "fl=123f456\ntls=TLSv1.3\nsni=plaintext\nwarp=off\ncolo=FRA\nhttp=http/2\nloc=FR\nvisit_scheme=https\nip=198.51.100.42\n";

  if (e.endsWith("sitemap.xml")) return (v) => v === "default"
    ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>`
    : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://example.com/</loc><priority>1.0</priority></url>\n<url><loc>https://example.com/about</loc><priority>0.8</priority></url>\n<url><loc>https://example.com/products</loc><priority>0.8</priority></url>\n<url><loc>https://example.com/contact</loc><priority>0.5</priority></url>\n</urlset>`;

  if (e.endsWith("ads.txt")) return (v) => v === "default"
    ? "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n"
    : "google.com, pub-9876543210987654, DIRECT, f08c47fec0942fa0\nexample.com, 1234567, RESELLER, abcdef123456\n";
  if (e.endsWith("sellers.json")) return (v) => v === "default"
    ? j(v, { sellers: [{ seller_id: "12345", name: "Example Corp", domain: "example.com" }] })
    : j(v, { sellers: [{ seller_type: "PUBLISHER", seller_id: "987654", name: "ACME Corporation", domain: "acme.example.com" }, { seller_type: "INTERMEDIARY", seller_id: "123456", name: "AdNetwork Pro", domain: "adnetwork.example.com" }] });

  if (e.includes(".well-known/") || e.includes("well-known/")) return (v) => j(v, { service: "discord" });

  if (e.includes(".vscode/") || e.includes("vscode/")) return (v) => j(v, { host: "production-server", protocol: "sftp", username: "deploy", remotePath: "/var/www/production" });

  if (e.startsWith("/api/") || e.includes("/api/") || e.endsWith(".do") || e.endsWith(".ashx") || e.endsWith(".cgi") || e.endsWith(".asp") || e.endsWith(".aspx")) {
    const name = e.split("/").pop() || "endpoint";
    return (v) => j(v, { endpoint: name, count: v === "default" ? undefined : 42 });
  }

  if (/^\/(index|app|mobile|wap|Home|im|client|site|front|public|static)\//.test(e)) {
    const name = e.split("/").filter(Boolean).pop() || "data";
    const module = e.split("/").filter(Boolean).slice(0, -1).pop() || "service";
    return (v) => j(v, { endpoint: name, module, ts: ts() });
  }

  if (e.endsWith(".do") || e.endsWith(".action")) {
    const name = e.split("/").pop()?.replace(/\.(do|action)$/, "") || "action";
    return (v) => j(v, { action: name, status: "ok" });
  }

  if (e.startsWith("/merchant/")) return (v) => genMerchant(v, e);

  if (e.includes("nice%20ports") || e.includes("hazelcast") || e.includes("cgi/conf.bin")) {
    return (v) => genScannerPath(v, e);
  }

  if (/^\/[a-zA-Z0-9]{6,}$/.test(e) && !e.includes(".")) return (v) => genC2Heartbeat(v, e);

  if (/dao|jiaoyi|tcn|qs/.test(e)) return (v) => genChineseApi(v, e);

  if (e.includes("/.svn/") || e.includes("/svn/") || e.includes("_vti_pvt") || e.includes("vti_pvt")) {
    return (v) => v === "default"
      ? JSON.stringify({ repository: "https://svn.example.com/project", revision: 12834, last_committer: "admin" }, null, 2)
      : JSON.stringify({ repository: "https://svn.example.com/project/trunk", revision: 89234, last_committer: "admin", last_commit_date: ts(), files: 1243, authors: ["admin", "devops", "john.doe", "jane.smith"] }, null, 2);
  }

  if (e.includes("phpunit") && e.includes("eval-stdin")) {
    return (v) => v === "default" ? "RCE Enabled" : "HTTP/1.1 200 OK\nContent-Type: text/plain\n\nPHPUnit RCE: system('id') output: uid=33(www-data) gid=33(www-data) groups=33(www-data)";
  }

  if (e.endsWith(".php") && !e.endsWith("config.php") && !e.includes("wp-")) {
    return (v) => v === "default"
      ? JSON.stringify({ code: 0, message: "ok", php: "8.1.12", memory: "256M" }, null, 2)
      : `<?php\n// ${e} endpoint\nheader('Content-Type: application/json');\necho json_encode([\n  'code' => 0,\n  'message' => 'ok',\n  'endpoint' => '${e}',\n  'php_version' => '8.1.12',\n  'memory' => '512M',\n  'execution_time' => '0.042s',\n  'db_status' => 'connected',\n  'cache_status' => 'hit',\n]);\n?>`;
  }

  if (e.endsWith(".html") || e.endsWith(".htm")) {
    const label = e.split("/").pop()?.replace(/\.html?$/, "") || "page";
    return (v) => genGenericPage(v, label, label.replace(/^\w/, (c) => c.toUpperCase()));
  }

  if (e.endsWith(".js") || e.endsWith(".script")) {
    return (v) => v === "default"
      ? "console.log('loaded');"
      : `(function(){'use strict';var app=window.app||{};app.config={env:'production',debug:false,apiUrl:'https://api.example.com/v2',version:'2.4.1'};app.ready=function(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn);};app.ready(function(){console.log('App initialized');});window.app=app;})();`;
  }

  if (e.endsWith(".zip") || e.endsWith(".tar.gz") || e.endsWith(".tgz")) {
    return (v) => v === "default" ? "PK\u0003\u0004\n# binary archive" : "PK\u0003\u0004\n# Archive: backup\n# Files: 234\n# Size: 1.2GB\n# Contains: database dump, uploads, configs\n# Created: " + ts();
  }

  if (e.endsWith(".css")) {
    return (v) => v === "default"
      ? "body{font-family:sans-serif;margin:0;padding:0}"
      : "/* Main stylesheet v2.4.1 */\n*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;background:#f8f9fa;line-height:1.6}\n.container{max-width:1200px;margin:0 auto;padding:0 20px}\nheader{background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.1);padding:16px 0}\n.btn{display:inline-block;padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer;transition:all .2s}\n.btn-primary{background:#0066cc;color:#fff;border:none}\n.btn-primary:hover{background:#0052a3}";
  }

  if (e.endsWith(".json")) {
    const name = e.split("/").pop()?.replace(".json", "") || "config";
    return (v) => j(v, { config_name: name, environment: v === "default" ? "dev" : "production", updated_at: ts() });
  }

  if (e.endsWith(".asmx") || e.includes(".asmx/")) {
    const action = e.split("/").pop() || "ServiceMethod";
    return (v) => v === "default"
      ? `<string xmlns="http://tempuri.org/">OK</string>`
      : `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${action}Response xmlns="http://tempuri.org/"><${action}Result><status>success</status><data>processed</data><timestamp>${ts()}</timestamp></${action}Result></${action}Response></soap:Body></soap:Envelope>`;
  }

  if (e.includes("index.php/")) {
    return (v) => `<?php\n// Dynamic route: ${e}\nheader('Content-Type: application/json');\necho json_encode(['status'=>'success','route'=>'${e}','method'=>$_SERVER['REQUEST_METHOD']]);\n?>`;
  }

  if (e.includes("taobao") || e.includes("1688") || e.includes("alibaba")) {
    return (v) => v === "default"
      ? JSON.stringify({ success: true, data: { items: [] } }, null, 2)
      : JSON.stringify({ success: true, data: { items: [{ id: 1, title: "商品名称", price: 99.00, sales: 1000 }, { id: 2, title: "另一个商品", price: 199.00, sales: 500 }], total: 2, page: 1, pageSize: 20 }, requestId: `req_${Date.now().toString(36)}`, timestamp: Date.now() }, null, 2);
  }

  if (e.includes("sbor_offerov") || e.includes("kripta") || e.includes("gaz") || e.includes("sber")) {
    return (v) => genLanding(v, e.includes("gaz") ? "Газпромбанк" : e.includes("sber") ? "СберБанк" : "Банк");
  }

  if (e.includes("/manage/") || e.includes("account/login") || e.includes("/admin/")) {
    return (v) => genLoginPage(v, "Management Console");
  }

  if (e.includes("/stock/") || e.includes("/kline") || e.includes("/allticker") || e.includes("coin") || e.includes("trading") || e.includes("trader")) {
    return (v) => v === "default"
      ? JSON.stringify({ symbol: (e.split("/").pop() || "BTC").toUpperCase(), price: 42150.00, change: "+2.34%" }, null, 2)
      : JSON.stringify({ symbol: (e.split("/").pop() || "BTC").toUpperCase(), price: 42150.00, open: 41200.00, high: 42580.00, low: 41050.00, volume: 1250000, change: "+2.34%", timestamp: ts(), exchange: "binance", status: "open" }, null, 2);
  }

  if (/^\/[a-zA-Z0-9_.-]{1,20}$/.test(e) && !e.includes(".")) return (v) => genShortPath(v, e);

  // ─── Specific catchall replacements (21 endpoints) ─────────────────────────

  if (e === "/Ctrls/GetSysCoin") return (v) => j(v, { coins: { usdt: 1250.50, btc: 0.042, eth: 2.5, total_usdt: 1250.50 }, locked: 0, withdrawable: 1250.50 });
  if (e === "/biz/server/config") return (v) => j(v, { region: "ap-southeast-1", environment: "production", features: ["payment", "chat", "notification"], max_users: 100000, maintaince: false });
  if (e === "/dwcc/configxLxn/inxfx") return (v) => j(v, { interface: "ConfigX", version: "2.1.3", params: { timeout: 30, retry: 3, cache_ttl: 300 } });
  if (e === "/f/user/index") return (v) => j(v, { user_count: 42891, online_count: 1234, new_today: 89, male_ratio: 0.62, female_ratio: 0.38 });
  if (e === "/forerest/user/custSrv/findOne") return (v) => j(v, { service_id: "CS-2025-8912", name: "Online Support", status: "online", queue_length: 3, avg_wait_sec: 45 });
  if (e === "/friendGroup/list") return (v) => j(v, { groups: [], total: 0, page: 1, pageSize: 20 });
  if (e === "/home/help") return (v) => j(v, { title: "Help Center", sections: ["Account", "Payment", "Security", "Trading"], contact: "support@example.com" });
  if (e === "/home/index") return (v) => j(v, { banners: [{ id: 1, title: "Welcome", link: "/activity" }], notice: "System maintenance every Sunday 3:00-5:00 AM" });
  if (e === "/home/realtime/data") return (v) => v === "default"
    ? JSON.stringify({ online_users: 1234, total_trades_24h: 56789, volume_24h: 1250000.50 }, null, 2)
    : JSON.stringify({ online_users: 1234, total_trades_24h: 56789, volume_24h: 1250000.50, avg_response_ms: 42, uptime_percent: 99.97, active_rooms: 89, timestamp: ts() }, null, 2);
  if (e === "/mall/toget/banner") return (v) => j(v, { banners: [{ id: 101, title: "Summer Sale", image_url: "https://cdn.example.com/banners/summer.jpg", link: "/activity/summer" }, { id: 102, title: "New Arrivals", image_url: "https://cdn.example.com/banners/new.jpg", link: "/mall/new" }] });
  if (e === "/masterControl/getSystemSetting") return (v) => j(v, { maintenance_mode: false, registration_open: true, withdrawal_enabled: true, deposit_enabled: true, min_withdrawal: 10, max_withdrawal: 50000, currency: "USDT" });
  if (e === "/mytio/config/base") return (v) => j(v, { app_name: "Mytio", version: "3.2.1", api_base: "https://api.mytio.example.com/v3", ws_url: "wss://ws.mytio.example.com", features: { live_chat: true, push_notify: true, dark_mode: true } });
  if (e === "/other/getTopQuestion") return (v) => j(v, { questions: [{ id: 1, title: "How to deposit?", answer: "Go to Wallet > Deposit" }, { id: 2, title: "How to withdraw?", answer: "Go to Wallet > Withdraw" }, { id: 3, title: "Contact support?", answer: "Use live chat or email support@example.com" }] });
  if (e === "/pro/qb365") return (v) => j(v, { product: "QB365 Pro", status: "active", version: "2.0.1", expiry: "2026-12-31", features: ["real-time", "analytics", "alerts", "api-access"] });
  if (e === "/proxy/games") return (v) => j(v, { games: [], total: 0, categories: ["slot", "live", "sport", "lottery"], providers: ["PGSoft", "JDB", "CQ9"] });
  if (e === "/room/getRoomBangFans") return (v) => j(v, { fans: [], total: 0, page: 1, pageSize: 20, room_id: "room_8912", popularity: 1234 });
  if (e === "/s_api/basic/download/info") return (v) => j(v, { latest_version: "2.4.1", min_version: "2.0.0", download_url: "https://cdn.example.com/app/latest.apk", size_mb: 42.5, force_update: false });
  if (e === "/setting/global") return (v) => j(v, { language: "en", timezone: "UTC+8", currency: "USDT", theme: "dark", notification_enabled: true, sound_enabled: true });
  if (e === "/stage-api/common/configKey/all") return (v) => j(v, { keys: ["payment_gateway", "sms_provider", "push_service", "recaptcha_key"], environment: "staging", region: "us-east-1" });
  if (e === "/support/index") return (v) => j(v, { support_types: ["live_chat", "email", "phone"], working_hours: "24/7", email: "support@example.com", phone: "+1-555-123-4567" });
  if (e === "/unSecurity/app/config") return (v) => j(v, { app_id: "app_2025_8912", api_key: "sk-abc123def456", allowed_ips: ["10.0.0.0/8", "172.16.0.0/12"], rate_limit: 100, rate_limit_window_sec: 60 });

  return (v) => genCatchall(v, e);
}

function classifySpecific(endpoint: string): Gen | null {
  const prev = classify(endpoint) as Gen;
  const str = prev.toString();
  if (str.includes("genCatchall")) return null;
  return prev;
}

export function generateMockup(variant: Variant, endpoint: string): string | null {
  const gen = classify(endpoint);
  if (!gen) return null;
  return gen(variant);
}

export { classify, classifySpecific, genCatchall, ts };

// ─── ENDPOINTS ──────────────────────────────────────────────────────────────

export const ALL_ENDPOINTS = ["/","/$web/index.html","/+CSCOE+/logon.html","/.aws/credentials","/.env","/.env.production","/.git/HEAD","/.git/config","/.kube/config","/.ssh/id_ecdsa","/.ssh/id_ed25519","/.ssh/id_rsa","/.svn/wc.db","/.vscode/sftp.json","/.well-known/discord","/.well-known/traffic-advice","/262LBNFp","/2MTXvx","/3ds.php","/3ds1633693954432212","/3vt4yTCT","/5jshCV","/6bXX29bt","/6tJmP253","/8","/888","/999","/API/Web/chat.ashx","/C9KrpPhC","/Ctrls/GetSysCoin","/G5LZ2X3k","/H6W7VRDj","/Home/Get/getJnd28","/Home/GetInitSource","/Home/Index/api","/KLFzmbdm","/KQRDmgB","/Kd67Fq1x","/Kj5xBrWf","/LcMMvHcm","/N3qLdCWJ","/Pay_Index.html","/Public/Home/ecshe_css/main.css","/Public/Mobile/ecshe_css/wapmain.css","/Public/initJs.php","/Q8RBNw4z","/SP6YZWTP","/T8LMdb3N","/YRWnWHy7","/_vti_pvt/administrators.pwd","/_vti_pvt/authors.pwd","/_vti_pvt/service.pwd","/a","/about","/account_domain.php","/acubu","/admin","/admin/index.html","/admin/webadmin","/admin/webadmin.php","/ads.txt","/ajax/allcoin_a/id/0","/api/.env","/api/Business","/api/Event/basic","/api/Home/videoNew","/api/admin/settings.php","/api/app/indexList","/api/appVersion","/api/apps/config","/api/banner","/api/c/a","/api/client/app/config.do","/api/common/config","/api/config","/api/config/getkefu","/api/currency/quotation_new","/api/front/index","/api/getCustomLink","/api/home/customerService","/api/im/v2/app/config","/api/index/getConfig","/api/index/grailindex","/api/index/init","/api/index/web","/api/index/webconfig","/api/message/webInfo","/api/notice","/api/ping","/api/predict-whole-panel.do","/api/product/getPointStore","/api/public","/api/shares/hqStrList","/api/shop/getKF","/api/site/getInfo.do","/api/stock/getSingleStock.do","/api/system/systemConfigs/getCustomerServiceLink","/api/unSecurity/app/listAppVersionInfo","/api/uploads/apimap","/api/user/ismustmobile","/api/v/index/queryOfficePage","/api/v1/member/kefu","/api/version","/api/vue/transaction/config","/app","/app-ads.txt","/app/api/app/get_index","/appxz/index.html","/aws/credentials","/ay-1.html","/backup.sql","/backup.tar.gz","/backup.zip","/baidu.html","/banner.do","/biz/server/config","/blog","/bpffH5jB","/cabinet","/cdn-cgi/trace","/cgi-bin/login.cgi","/cgi/conf.bin","/client/api/findConfigByKey","/cloud-config.yml","/code1.html","/config.json","/config.php","/config.xml","/config.yaml","/config.yml","/config/database","/config/database.php","/config/production.json","/contact","/cx_platform/conf.json","/data/json/config.json","/database.sql","/ddoo_im","/dist/index.html","/dl1/index.html","/doc/index.html","/docker-compose.yml","/dsxs","/dump.sql","/dwcc/configxLxn/inxfx","/env","/env.production","/etc/shadow","/etc/ssl/private/server.key","/f/user/index","/fake-wordpress.zip","/fePublicInfo","/feed","/fns-886-75.html","/forerest/user/custSrv/findOne","/fpyB8SZ3","/friendGroup/list","/front/index/getSiteSetting","/getConfig/getArticle.do","/getConfig/listPopFrame.do","/getLocale","/git/HEAD","/git/config","/gpLFR5sr","/h5","/h5.2.taobao","/hazelcast/rest/cluster","/home.html","/home/help","/home/index","/home/index.html","/home/realtime/data","/homes","/htop","/iexchange/webtrader","/im","/im/App/config","/im/h5","/imei","/index.php","/index.php/Wap/Api/getBanner","/index.php/sign","/index/api/getweb","/index/aurl","/index/home/login.html","/index/index/getchatLog","/index/index/home","/index/index/info","/index/login","/index/login/index","/index/login/register","/index/police/index.html","/index/user/register","/index_sber","/index_sber.php","/infe/rest/fig/advertise/common.json","/jiaoyimao","/js/a.script","/js/post.js","/jym-wn","/kPKzkZzY","/kline/1m/1","/km.asmx/getPlatParam","/kube/config","/lander/-w--sber-chat_1720439685","/lander/05_042_offer_sber_chat_input_green_v3_nm","/lander/1_offer_sber_chat_input_green_v3_nm","/lander/gazinvest-forma9maymadrid-thanksqz9may/thank-QZ","/lander/gazprom-prelandergnidanewkomment-thanksstory2-objv2/land/thank-you","/lander/gp_newmain_calc_ru_land_obj_js_v2/index","/lander/gp_newmain_calc_ru_land_obj_js_v2/index.php","/lander/gpb_rus_short_obfs_nonetext","/lander/sber","/lander/sber-fix","/lander/sberchat5v4_tds_newcrm_028-vnutr/index","/lander/sberchat5v4_tds_newcrm_028-vnutr/index.php","/lander/sberchat5v4_tds_newcrm_038-vnutr_1721815245/index","/lander/sberchat5v4_tds_newcrm_038-vnutr_1721815245/index.php","/lander/sberquiz-2223-3","/lander/test","/lander/testsberv4-copy--1","/lander/testsberv4_1703110539","/leftDao","/leftDao.php","/login.jsp","/logon.htm","/logs","/m","/m.html","/m/allticker/1","/mall/toget/banner","/manage/account/login","/market/market-ws/iframe.html","/masterControl/getSystemSetting","/melody/api/v1/pageconfig/list","/merchant/code","/merchant/z/payment","/meta.json","/mhn8PLGw","/mindex.html","/mobile","/mobile/get_item_list","/mobile/index/home","/mobile/lists.html","/mobile/login.html","/mobile/v3/appSuperDownload.do","/mytio/config/base","/n4TWwtZ4","/n5cw4Z3Y","/n6PdMqLz","/newTop","/nice%20ports%2C/Tri%6Eity.txt%2ebak","/nnnnnnnnnnnnnnnnnnnnnnn","/otc","/other/getTopQuestion","/page","/pc.html","/phpinfo","/phpinfo.php","/platform","/portal/index/protocol.html","/pro/qb365","/procoin/config/all.do","/products","/proxy/games","/public/api/index/config","/q1gpDhK4","/qqWydpQ7","/qs","/refresher","/room/getRoomBangFans","/s_api/basic/download/info","/sb","/sberbank-quiz-4","/sberbank-quiz-v2","/sberchat008-prilca","/sbor_offerov/kripta/landing/lp_1","/secrets.json","/sellers.json","/server-info","/server.key","/setting/global","/site/api/v1/site/vipExclusiveDomain/getGuestDomain","/site/info","/sitemap.xml","/ssh/id_ecdsa","/ssh/id_ed25519","/ssh/id_rsa","/stage-api/common/configKey/all","/static/data/thirdgames.json","/static/mobile/user.html","/static/voice/default.wav","/step1.asp","/stock/mzhishu","/support/index","/svn/wc.db","/t85TjsNn","/tcn","/template/mb/lang/text-zh.json","/tink_chat","/tinkoff-v10-quiz","/unSecurity/app/config","/user/reg.php","/user_secrets.yml","/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin","/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php","/verification.asp","/vti_pvt/administrators.pwd","/vti_pvt/authors.pwd","/vti_pvt/service.pwd","/wap","/wap/api/exchangerateuserconfig!get.action","/wap/forward","/web.config","/well-known/discord","/well-known/traffic-advice","/wordpress/wp-admin/setup-config","/wordpress/wp-admin/setup-config.php","/wordpress/wp-content","/wp-admin","/wp-admin/admin-ajax","/wp-admin/setup-config.php","/wp-config","/wp-config.php","/wpR2pHDz","/xy","/z03.html","/zMmL28CN"];
