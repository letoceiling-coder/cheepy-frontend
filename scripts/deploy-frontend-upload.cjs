/**
 * Деплой фронта: сборка локально + загрузка dist на сервер.
 * Гарантирует, что на сервере именно эта сборка (никакого кэша/старого кода).
 *
 * Путь на сервере: /var/www/siteaacess.store/dist
 * Nginx root должен быть: /var/www/siteaacess.store/dist
 *
 * Требует: .env.deploy с DEPLOY_SSH=root@85.117.235.93
 * Использование: npm run build && node scripts/deploy-frontend-upload.cjs
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const envDeploy = path.join(rootDir, ".env.deploy");

if (fs.existsSync(envDeploy)) {
  const content = fs.readFileSync(envDeploy, "utf8");
  content.split("\n").forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
}

const ssh = process.env.DEPLOY_SSH || "root@85.117.235.93";
const remoteDir = "/var/www/siteaacess.store";
const remoteDist = remoteDir + "/dist";

if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("Нет локальной сборки. Сначала: npm run build");
  process.exit(1);
}

console.log("Deploy frontend: загрузка dist на сервер", remoteDist);
const tarName = "dist-deploy.tar";
try {
  execSync(`tar -cf ${tarName} -C dist .`, { stdio: "inherit", shell: true, cwd: rootDir });
  execSync(`scp ${tarName} ${ssh}:${remoteDir}/${tarName}`, { stdio: "inherit", shell: true, cwd: rootDir });
  fs.unlinkSync(path.join(rootDir, tarName));
  execSync(
    `ssh ${ssh} "cd ${remoteDir} && rm -rf dist && mkdir -p dist && tar -xf dist-deploy.tar -C dist && rm dist-deploy.tar && systemctl reload nginx"`,
    { stdio: "inherit", shell: true }
  );
  console.log("Готово. Фронт обновлён:", remoteDist);
} catch (e) {
  process.exit(e.status || 1);
}
