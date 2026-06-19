import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const KEYS_DIR = path.join(process.cwd(), "powersync", "keys");

export function getPrivateKey(): string {
  if (process.env.POWERSYNC_PRIVATE_KEY) {
    return process.env.POWERSYNC_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  return fs.readFileSync(path.join(KEYS_DIR, "private.pem"), "utf-8");
}

export function getPublicKeyJwk() {
  let pem: string;
  if (process.env.POWERSYNC_PUBLIC_KEY) {
    pem = process.env.POWERSYNC_PUBLIC_KEY.replace(/\\n/g, "\n");
  } else {
    pem = fs.readFileSync(path.join(KEYS_DIR, "public.pem"), "utf-8");
  }
  const key = crypto.createPublicKey(pem);
  const jwk = key.export({ format: "jwk" });
  return { ...jwk, kid: "powersync-dev", alg: "RS256", use: "sig" };
}
