const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");

const admin = `Kya-${crypto.randomBytes(4).toString("hex")}`;
const cv = `Cv-${crypto.randomBytes(4).toString("hex")}`;
const secret = crypto.randomBytes(32).toString("hex");
const block = [
  `AUTH_SECRET="${secret}"`,
  `ADMIN_EMAIL="koukouiyohannarmel@gmail.com"`,
  `ADMIN_PASSWORD_HASH="${bcrypt.hashSync(admin, 12)}"`,
  `CV_PASSWORD_HASH="${bcrypt.hashSync(cv, 12)}"`,
  `CV_FILE_NAME="CV_Yohann_Armel_K.pdf"`,
  `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`,
].join("\n");

fs.appendFileSync(".env", `\n${block}\n`);
fs.writeFileSync(
  "ACCES-LOCAL.txt",
  [
    "Ces accès sont locaux. Ne les publie pas.",
    "Email back-office: koukouiyohannarmel@gmail.com",
    `Mot de passe back-office: ${admin}`,
    `Mot de passe CV: ${cv}`,
    "",
  ].join("\n")
);
console.log("access-file-written");
