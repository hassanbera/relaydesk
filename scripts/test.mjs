import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { mkdirSync, openSync, closeSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
const root = fileURLToPath(new URL("../", import.meta.url));
const db = "relaydesk_test_" + randomBytes(8).toString("hex");
if (!/^relaydesk_test_[a-f0-9]{16}$/.test(db))
  throw new Error("Invalid isolated database name");
const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: `postgresql://relaydesk:local_development_only@127.0.0.1:55520/${db}`,
  SEED_PASSWORD: randomBytes(24).toString("base64url"),
  PUBLIC_ORIGIN: "http://127.0.0.1:5501",
};
function run(command, args, extra = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    ...extra,
  });
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status})`);
}
function npm(args) {
  run(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    shell: process.platform === "win32",
  });
}
let api,
  created = false,
  log;
try {
  run("docker", ["compose", "up", "-d", "--wait"]);
  npm(["run", "build", "-w", "@relaydesk/contracts"]);
  npm(["run", "build", "-w", "@relaydesk/api"]);
  run("docker", [
    "compose",
    "exec",
    "-T",
    "db",
    "createdb",
    "-U",
    "relaydesk",
    db,
  ]);
  created = true;
  npm(["run", "db:migrate"]);
  npm(["run", "db:seed"]);
  const socket = createServer();
  await new Promise((r) => socket.listen(0, "127.0.0.1", r));
  const port = socket.address().port;
  await new Promise((r) => socket.close(r));
  env.PORT = String(port);
  env.HOST = "127.0.0.1";
  env.TEST_API = `http://127.0.0.1:${port}/api`;
  mkdirSync(new URL("../test-results", import.meta.url), { recursive: true });
  log = openSync(new URL("../test-results/api.log", import.meta.url), "w");
  api = spawn(process.execPath, ["dist/main.js"], {
    cwd: fileURLToPath(new URL("../apps/api/", import.meta.url)),
    env,
    stdio: ["ignore", log, log],
    windowsHide: true,
  });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (api.exitCode !== null) break;
    try {
      const r = await fetch(env.TEST_API + "/health");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(200);
  }
  if (!ready)
    throw new Error("Isolated API failed to start. See test-results/api.log");
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test", "apps/api/test/integration.test.ts"],
    { cwd: root, env, stdio: "inherit" },
  );
  if (result.status !== 0) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (api && api.exitCode === null) {
    api.kill();
    await Promise.race([new Promise((r) => api.once("exit", r)), delay(5000)]);
    if (api.exitCode === null) api.kill("SIGKILL");
  }
  if (log !== undefined) closeSync(log);
  if (created)
    run("docker", [
      "compose",
      "exec",
      "-T",
      "db",
      "dropdb",
      "-U",
      "relaydesk",
      "--force",
      "--if-exists",
      db,
    ]);
}
