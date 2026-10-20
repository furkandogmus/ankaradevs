// members/*.json dosyalarını site/members.json'da birleştirir; eklenme tarihini git geçmişinden alır.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const DIR = "members";
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".json")) : [];

function addedAt(path) {
  try {
    const out = execFileSync("git", ["log", "--diff-filter=A", "--follow", "--format=%aI", "--", path], { encoding: "utf8" });
    return out.trim().split("\n").filter(Boolean).pop() || null;
  } catch {
    return null;
  }
}

const members = files
  .map((f) => ({ ...JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")), added: addedAt(`${DIR}/${f}`) }))
  .sort((a, b) => a.name.localeCompare(b.name, "tr"));

writeFileSync("site/members.json", JSON.stringify({ count: members.length, members }, null, 2) + "\n");
console.log(`site/members.json: ${members.length} üye`);
