const { loadEnvConfig } = require("@next/env");
const bcrypt = require("bcryptjs");
const fs = require("fs");

loadEnvConfig(process.cwd());
const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
const text = fs.readFileSync("ACCES-LOCAL.txt", "utf8");
const matchLine = text.split(/\r?\n/).find((line) => line.includes("Kya-"));
const password = matchLine ? matchLine.split(":").pop().trim() : "";

console.log(JSON.stringify({
  hashPrefix: hash.slice(0, 4),
  hashLength: hash.length,
  passwordFound: password.length > 0,
  match: password ? bcrypt.compareSync(password, hash) : false,
}));
