import crypto from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error("Usage: node scripts/generate-admin-hash.mjs <password>");
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const derived = await new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key));
});

console.log(`scrypt:${salt}:${Buffer.from(derived).toString("hex")}`);
