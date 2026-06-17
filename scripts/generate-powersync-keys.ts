import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate RSA key pair for PowerSync JWT signing
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const keysDir = path.join(__dirname, "..", "powersync", "keys");
fs.mkdirSync(keysDir, { recursive: true });

fs.writeFileSync(path.join(keysDir, "private.pem"), privateKey);
fs.writeFileSync(path.join(keysDir, "public.pem"), publicKey);

console.log("✅ Generated RSA key pair in powersync/keys/");
console.log("   - private.pem (used to sign JWTs for mobile clients)");
console.log("   - public.pem (served via JWKS endpoint for PowerSync to verify)");
