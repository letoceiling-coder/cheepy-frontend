/**
 * DEPRECATED: Use deploy-remote.cjs (git + build on server) instead.
 * Kept for emergency SCP deploy: npm run deploy:scp
 *
 * Deploy dist/ to server via SCP.
 * Or env: DEPLOY_TARGET=user@host:path (e.g. u12345@cheepy.siteaccess.ru:public_html)
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const rootDir = path.join(__dirname, "..");
const envDeploy = path.join(rootDir, ".env.deploy");
if (fs.existsSync(envDeploy)) {
  const content = fs.readFileSync(envDeploy, "utf8");
  content.split("\n").forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
}

const distDir = path.join(rootDir, "dist");
if (!fs.existsSync(distDir)) {
  console.error("No dist/ folder. Run: npm run build");
  process.exit(1);
}

let target = process.env.DEPLOY_TARGET;
if (!target && process.env.DEPLOY_USER && process.env.DEPLOY_HOST && process.env.DEPLOY_PATH) {
  target = `${process.env.DEPLOY_USER}@${process.env.DEPLOY_HOST}:${process.env.DEPLOY_PATH}`;
}
if (!target) {
  console.error("Set deploy target:");
  console.error("  DEPLOY_TARGET=user@cheepy.siteaccess.ru:public_html");
  console.error("Or: DEPLOY_USER, DEPLOY_HOST, DEPLOY_PATH");
  process.exit(1);
}

console.log("Deploying dist/ to", target.replace(/:.*$/, ":..."));
try {
  const src = path.join(distDir, "*");
  execSync(`scp -r ${JSON.stringify(src)} ${JSON.stringify(target + "/")}`, { stdio: "inherit", shell: true });
  console.log("Deploy done.");
} catch (e) {
  process.exit(e.status || 1);
}
