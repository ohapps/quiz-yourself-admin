import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const KEYS_DIR = path.join(process.cwd(), "powersync", "keys");

export function getPrivateKey(): string {
  return fs.readFileSync(path.join(KEYS_DIR, "private.pem"), "utf-8");
}

export function getPublicKeyJwk() {
  const pem = fs.readFileSync(path.join(KEYS_DIR, "public.pem"), "utf-8");
  const key = crypto.createPublicKey(pem);
  const jwk = key.export({ format: "jwk" });
  return { ...jwk, kid: "powersync-dev", alg: "RS256", use: "sig" };
}
