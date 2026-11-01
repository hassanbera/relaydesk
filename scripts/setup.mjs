import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const envPath = new URL("../.env", import.meta.url);
if (!existsSync(envPath)) {
  writeFileSync(
    envPath,
    readFileSync(new URL("../.env.example", import.meta.url), "utf8").replace(
      "SEED_PASSWORD=",
      "SEED_PASSWORD=" + randomBytes(18).toString("base64url"),
    ),
    { mode: 0o600 },
  );
  console.log(
    "Local credentials created in ignored .env. Demo email: admin@relaydesk.test",
  );
}
for (const [cmd, args] of [
  ["docker", ["compose", "up", "-d", "--wait"]],
  ["npm", ["run", "build", "-w", "@relaydesk/contracts"]],
  ["npm", ["run", "db:migrate"]],
  ["npm", ["run", "db:seed"]],
]) {
  const r = spawnSync(
    process.platform === "win32" && cmd === "npm" ? "npm.cmd" : cmd,
    args,
    {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32" && cmd === "npm",
    },
  );
  if (r.status !== 0) process.exit(r.status || 1);
}
