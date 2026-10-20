// members/*.json dosyalarını doğrular.
// PR'da çalışırken (PR_AUTHOR ve BASE_SHA verilmişse) PR'ın sadece açanın kendi dosyasına dokunduğunu da kontrol eder.
// Workflow bu dosyayı base branch'ten çalıştırır; PR'daki değişiklikler doğrulamayı atlatamaz.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const DIR = "members";
const FIELDS = {
  name: { required: true, max: 60 },
  github: { required: true, max: 39 },
  title: { required: true, max: 60 },
  company: { max: 60 },
  bio: { max: 200 },
  skills: { required: true, list: true, min: 1, maxItems: 8, max: 24 },
  linkedin: { max: 120, pattern: /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]{3,100}\/?$/ },
  website: { max: 120, pattern: /^https:\/\/[^\s"'<>]+$/ },
  available_for: { list: true, maxItems: 3, oneOf: ["mentorluk", "konusmacilik", "is-firsati"] },
};
const FILE_RE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}\.json$/;

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

function validateFile(file) {
  const path = `${DIR}/${file}`;
  if (!FILE_RE.test(file)) return fail(path, "dosya adı küçük harfli GitHub kullanıcı adın olmalı: members/<kullanici-adi>.json");

  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return fail(path, `geçerli JSON değil (${e.message})`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return fail(path, "bir JSON nesnesi olmalı");

  for (const key of Object.keys(data)) {
    if (!(key in FIELDS)) fail(path, `tanımsız alan "${key}". İzin verilenler: ${Object.keys(FIELDS).join(", ")}`);
  }

  for (const [key, rule] of Object.entries(FIELDS)) {
    const v = data[key];
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
      if (rule.required) fail(path, `"${key}" zorunlu`);
      continue;
    }
    if (rule.list) {
      if (!Array.isArray(v)) { fail(path, `"${key}" bir liste olmalı`); continue; }
      if (rule.min && v.length < rule.min) fail(path, `"${key}" en az ${rule.min} öğe içermeli`);
      if (v.length > rule.maxItems) fail(path, `"${key}" en fazla ${rule.maxItems} öğe içerebilir`);
      if (new Set(v.map((x) => String(x).toLowerCase())).size !== v.length) fail(path, `"${key}" tekrar eden öğe içeriyor`);
      for (const item of v) {
        if (typeof item !== "string" || !item.trim()) { fail(path, `"${key}" öğeleri boş olmayan metin olmalı`); continue; }
        if (rule.max && item.length > rule.max) fail(path, `"${key}" öğesi en fazla ${rule.max} karakter: "${item}"`);
        if (rule.oneOf && !rule.oneOf.includes(item)) fail(path, `"${key}" sadece şunları içerebilir: ${rule.oneOf.join(", ")}`);
      }
      continue;
    }
    if (typeof v !== "string") { fail(path, `"${key}" metin olmalı`); continue; }
    if (v !== v.trim()) fail(path, `"${key}" başında/sonunda boşluk var`);
    if (v.length > rule.max) fail(path, `"${key}" en fazla ${rule.max} karakter`);
    if (/[<>]/.test(v)) fail(path, `"${key}" < ya da > içeremez`);
    if (rule.pattern && !rule.pattern.test(v)) fail(path, `"${key}" biçimi geçersiz: ${v}`);
  }

  if (typeof data.github === "string" && `${data.github.toLowerCase()}.json` !== file) {
    fail(path, `"github" alanı (${data.github}) dosya adıyla aynı olmalı`);
  }
}

function checkPrScope(author, base) {
  const own = `${DIR}/${author.toLowerCase()}.json`;
  const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" });
  const changed = out.split("\n").filter(Boolean);
  const others = changed.filter((f) => f !== own);
  if (others.length) {
    errors.push(
      `Bu PR sadece ${own} dosyasını ekleyebilir, değiştirebilir ya da silebilir. ` +
      `Kapsam dışı dosyalar: ${others.join(", ")}`
    );
  }
}

if (process.env.PR_AUTHOR && process.env.BASE_SHA) checkPrScope(process.env.PR_AUTHOR, process.env.BASE_SHA);

const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => !f.startsWith(".")) : [];
for (const f of files) validateFile(f);

if (errors.length) {
  console.error("Üye dosyası doğrulaması başarısız:\n");
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error("\nKılavuz: CONTRIBUTING.md");
  process.exit(1);
}
console.log(`✓ ${files.length} üye dosyası geçerli`);
