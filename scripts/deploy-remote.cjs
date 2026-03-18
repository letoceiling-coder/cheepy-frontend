/**
 * Deploy via SSH: copy deploy.sh to server and run it.
 * Requires: .env.deploy with DEPLOY_SSH=root@85.117.235.93
 * Or: DEPLOY_SSH environment variable
 *
 * Usage: node scripts/deploy-remote.cjs
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

const ssh = process.env.DEPLOY_SSH || "root@85.117.235.93";
const remotePath = "/var/www";

console.log("Deploy: copying scripts to server and running deploy...");
try {
  execSync(`scp ${path.join(rootDir, "scripts", "deploy.sh")} ${ssh}:${remotePath}/deploy.sh`, {
    stdio: "inherit",
    shell: true,
  });
  execSync(`scp ${path.join(rootDir, "scripts", "rollback.sh")} ${ssh}:${remotePath}/rollback.sh`, {
    stdio: "inherit",
    shell: true,
  });
  execSync(`ssh ${ssh} "chmod +x ${remotePath}/deploy.sh ${remotePath}/rollback.sh && bash ${remotePath}/deploy.sh"`, {
    stdio: "inherit",
    shell: true,
  });
  console.log("Deploy complete.");
} catch (e) {
  process.exit(e.status || 1);
}
