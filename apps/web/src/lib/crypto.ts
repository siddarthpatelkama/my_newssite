import { createCipheriv, randomBytes, scryptSync } from "node:crypto";

export function encryptSecret(plain: string, secret: string): string {
  const key = scryptSync(secret, "signalos-gmail", 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}
