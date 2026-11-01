import { scrypt, randomBytes, timingSafeEqual, createHash } from "node:crypto";
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [salt, key] = encoded.split(":");
  const derived = await derive(
    password,
    /^[a-f0-9]{32}$/.test(salt || "")
      ? salt
      : "00000000000000000000000000000000",
  );
  if (!/^[a-f0-9]{128}$/.test(key || "")) return false;
  return timingSafeEqual(Buffer.from(key, "hex"), derived);
}
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
