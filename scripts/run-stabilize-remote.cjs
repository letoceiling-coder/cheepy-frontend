/**
 * Run stabilization on server via SSH (nginx, deploy script, git sync, frontend build).
 * Requires: .env.deploy with DEPLOY_SSH=root@85.117.235.93
 *
 * Usage: node scripts/run-stabilize-remote.cjs
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
const frontendRemote = "/var/www/siteaacess.store";
const stabilizeScript = path.join(rootDir, "scripts", "stabilize-server.sh");

console.log("Stabilize: copying script to server and running...");
try {
  let scriptContent = fs.readFileSync(stabilizeScript, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const tmpScript = path.join(require("os").tmpdir(), "stabilize-server.sh");
  fs.writeFileSync(tmpScript, scriptContent, "utf8");
  execSync(`scp ${tmpScript} ${ssh}:${frontendRemote}/scripts/stabilize-server.sh`, {
    stdio: "inherit",
    shell: true,
  });
  fs.unlinkSync(tmpScript);
  execSync(`ssh ${ssh} "bash ${frontendRemote}/scripts/stabilize-server.sh"`, {
    stdio: "inherit",
    shell: true,
  });
  console.log("Stabilize complete.");
} catch (e) {
  process.exit(e.status || 1);
}
